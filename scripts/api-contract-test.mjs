#!/usr/bin/env node
/**
 * Contract test for every backend route the frontend consumes.
 *
 * Checks three things per operation: the HTTP status, that list routes return a
 * bare JSON array (the frontend types depend on this — only /analytics/channels
 * and /reports/campaign-performance are enveloped in `items`), and that the
 * payload carries the keys `src/lib/api/schema.ts` declares, at their Excel
 * serialization aliases.
 *
 * Built for a freshly migrated database: it discovers ids from list routes
 * rather than assuming any exist, and reports dependent checks as SKIP when a
 * table is empty instead of failing them.
 *
 * Usage
 *   node scripts/api-contract-test.mjs                      # reads only
 *   node scripts/api-contract-test.mjs --mutations          # + writes, with cleanup
 *   node scripts/api-contract-test.mjs --train              # + POST /ml/train
 *   node scripts/api-contract-test.mjs --proxy              # through Next at :3000/api
 *   node scripts/api-contract-test.mjs --base=http://host:8000/api
 *   node scripts/api-contract-test.mjs --json=report.json   # machine-readable output
 */

import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const RUN_MUTATIONS = flag("mutations");
const RUN_TRAINING = flag("train");
const JSON_OUT = value("json", null);
const BASE = (
  flag("proxy")
    ? value("base", "http://127.0.0.1:3000/api")
    : value("base", "http://127.0.0.1:8000/api")
).replace(/\/+$/, "");
/** The public health route sits outside the /api prefix. */
const ROOT_BASE = BASE.replace(/\/api$/, "");

const TIMEOUT_MS = Number(value("timeout", "30000"));

/* ── Reporting ───────────────────────────────────────────────────────────── */

const results = [];
const C = {
  reset: "[0m",
  dim: "[2m",
  red: "[31m",
  green: "[32m",
  yellow: "[33m",
  cyan: "[36m",
  bold: "[1m",
};

function record(outcome, op, detail = "", status = null) {
  results.push({ outcome, op, detail, status });
  const mark =
    outcome === "PASS"
      ? `${C.green}PASS${C.reset}`
      : outcome === "FAIL"
        ? `${C.red}FAIL${C.reset}`
        : `${C.yellow}SKIP${C.reset}`;
  const statusText = status === null ? "" : `${C.dim}[${status}]${C.reset} `;
  console.log(`  ${mark} ${statusText}${op}${detail ? ` ${C.dim}— ${detail}${C.reset}` : ""}`);
}

function section(title) {
  console.log(`\n${C.bold}${C.cyan}${title}${C.reset}`);
}

/* ── HTTP ────────────────────────────────────────────────────────────────── */

async function call(method, path, { body, base = BASE } = {}) {
  const url = `${base}${path}`;
  const init = {
    method,
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url, init);
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }
  return { status: response.status, payload };
}

/* ── Assertions ──────────────────────────────────────────────────────────── */

/** Reports missing keys rather than the first one, so one run shows every drift. */
function missingKeys(object, keys) {
  if (!object || typeof object !== "object") return keys;
  return keys.filter((key) => !(key in object));
}

/**
 * @param shape.list     response must be a bare JSON array
 * @param shape.envelope response must be `{ items: [...] }`
 * @param shape.keys     keys required on the object (or on each array member)
 * @param expect         acceptable status codes
 */
async function check(op, method, path, shape = {}, options = {}) {
  const { expect = [200], body, base } = options;
  let response;
  try {
    response = await call(method, path, { body, base });
  } catch (error) {
    const reason =
      error?.name === "TimeoutError"
        ? `timed out after ${TIMEOUT_MS}ms`
        : (error?.cause?.code ?? error?.message ?? "request failed");
    record("FAIL", op, `unreachable: ${reason}`);
    return null;
  }

  if (!expect.includes(response.status)) {
    const detail =
      typeof response.payload === "object" && response.payload?.detail
        ? JSON.stringify(response.payload.detail).slice(0, 160)
        : String(response.payload ?? "").slice(0, 160);
    record("FAIL", op, `expected ${expect.join("/")}, got ${response.status}. ${detail}`, response.status);
    return null;
  }

  if (response.status === 204) {
    record("PASS", op, "no content", 204);
    return response;
  }

  const problems = [];

  if (shape.list) {
    if (!Array.isArray(response.payload)) {
      problems.push(
        `expected a bare JSON array, got ${
          response.payload && typeof response.payload === "object"
            ? `object with keys [${Object.keys(response.payload).slice(0, 5).join(", ")}]`
            : typeof response.payload
        }`,
      );
    } else if (response.payload.length > 0 && shape.keys) {
      const missing = missingKeys(response.payload[0], shape.keys);
      if (missing.length) problems.push(`item missing: ${missing.join(", ")}`);
    }
  } else if (shape.envelope) {
    if (!response.payload || !Array.isArray(response.payload.items)) {
      problems.push("expected { items: [...] }");
    } else if (response.payload.items.length > 0 && shape.keys) {
      const missing = missingKeys(response.payload.items[0], shape.keys);
      if (missing.length) problems.push(`item missing: ${missing.join(", ")}`);
    }
  } else if (shape.keys) {
    const missing = missingKeys(response.payload, shape.keys);
    if (missing.length) problems.push(`missing: ${missing.join(", ")}`);
  }

  if (problems.length) {
    record("FAIL", op, problems.join("; "), response.status);
    return response;
  }

  const size = Array.isArray(response.payload)
    ? `${response.payload.length} rows`
    : Array.isArray(response.payload?.items)
      ? `${response.payload.items.length} items`
      : "";
  record("PASS", op, size, response.status);
  return response;
}

/* ── Expected keys, mirroring src/lib/api/schema.ts ──────────────────────── */

const KEYS = {
  health: ["status", "database"],
  overview: [
    "total_customers",
    "total_leads",
    "total_campaigns",
    "total_calls",
    "open_tasks",
    "pending_followups",
    "converted_leads",
    "conversion_rate",
  ],
  funnel: [
    "new_leads",
    "qualified_leads",
    "converted_leads",
    "lost_leads",
    "total_leads",
    "conversion_rate",
  ],
  channelItem: ["channel", "lead_count", "engagement_events"],
  customer: [
    "id",
    "Customer_ID",
    "CRM_Gender",
    "CRM_Age_Band",
    "CRM_Income_Band",
    "CRM_Occupation",
    "created_at",
    "Excel_Fields",
  ],
  lead: [
    "id",
    "customer_id",
    "campaign_id",
    "CRM_Channel",
    "CRM_Data_Medium",
    "Label_Source_Lead_Status",
    "current_stage",
    "current_section",
    "current_handler",
    "priority",
    "lead_score",
    "created_at",
    "Excel_Fields",
  ],
  campaign: [
    "id",
    "code",
    "CRM_UTM_Campaign",
    "CRM_UTM_Source",
    "status",
    "created_at",
    "Excel_Fields",
  ],
  product: ["id", "CRM_Product_Code", "CRM_Product_Name", "created_at", "Excel_Fields"],
  call: [
    "id",
    "lead_id",
    "customer_id",
    "CDR_Call_Direction",
    "CDR_Top_Call_Status",
    "CDR_Avg_Talk_Sec",
    "created_at",
    "Excel_Fields",
  ],
  task: [
    "id",
    "lead_id",
    "customer_id",
    "Label_Source_Disposition",
    "status",
    "priority",
    "created_at",
    "Excel_Fields",
  ],
  followup: [
    "id",
    "task_id",
    "lead_id",
    "customer_id",
    "channel",
    "Label_Basis",
    "status",
    "created_at",
    "Excel_Fields",
  ],
  engagementEvent: [
    "id",
    "lead_id",
    "customer_id",
    "campaign_id",
    "CRM_Channel",
    "metric_type",
    "MSG_Engaged",
    "event_time",
    "Excel_Fields",
  ],
  websiteEvent: [
    "id",
    "lead_id",
    "customer_id",
    "event_name",
    "WEB_Step_Name",
    "WEB_Step_Number",
    "WEB_Device_Type",
    "WEB_New_Vs_Repeat",
    "event_time",
    "Excel_Fields",
  ],
  journeySummary: ["lead_id", "total_events", "unique_event_names", "last_event_time"],
  prediction: ["prediction_type", "model_name", "score", "label", "rationale", "details"],
  predictionLog: [
    "id",
    "lead_id",
    "customer_id",
    "prediction_type",
    "model_name",
    "score",
    "label",
    "created_at",
  ],
  analysis: ["lead_id", "customer_id", "generated_at", "predictions"],
  decision: [
    "decision_type",
    "recommended_action",
    "priority",
    "confidence",
    "rationale",
    "inputs",
  ],
  decisionLog: [
    "id",
    "lead_id",
    "customer_id",
    "decision_type",
    "recommended_action",
    "priority",
    "confidence",
    "created_at",
  ],
  pipeline: [
    "total_leads",
    "new_leads",
    "qualified_leads",
    "converted_leads",
    "lost_leads",
  ],
  workload: [
    "total_tasks",
    "open_tasks",
    "in_progress_tasks",
    "completed_tasks",
    "total_followups",
    "pending_followups",
    "completed_followups",
  ],
  campaignReportItem: [
    "campaign_id",
    "campaign_code",
    "campaign_name",
    "lead_count",
    "converted_leads",
    "conversion_rate",
  ],
  campaignPerformance: ["campaign_id", "total_events", "by_channel", "by_metric"],
  importJob: [
    "id",
    "dataset_name",
    "source_path",
    "status",
    "row_count",
    "valid_row_count",
    "invalid_row_count",
    "created_at",
  ],
  quality: ["generated_at", "table_counts", "completeness"],
  validation: ["generated_at", "total_issues", "issues"],
  exportResult: ["job_id", "resource", "file_format", "file_path", "row_count", "status"],
  model: ["model_name", "latest_job_id", "status", "training_rows", "created_at"],
  trainingJob: [
    "id",
    "model_name",
    "status",
    "training_rows",
    "metrics",
    "artifact_path",
    "created_at",
  ],
  leadDetails: [
    "lead",
    "customer",
    "campaign",
    "assignment",
    "engagement",
    "journey",
    "ai",
    "calls",
    "tasks",
    "followups",
    "outcomes",
    "timeline",
  ],
  assignment: [
    "id",
    "lead_id",
    "customer_id",
    "assignment_type",
    "from_section",
    "to_section",
    "is_current",
    "created_at",
  ],
  outcome: [
    "id",
    "lead_id",
    "customer_id",
    "action_type",
    "outcome_code",
    "followup_required",
    "created_at",
  ],
  timelineEvent: ["id", "lead_id", "customer_id", "event_type", "event_source", "created_at"],
};

const firstId = (response) =>
  Array.isArray(response?.payload) && response.payload.length > 0
    ? response.payload[0].id
    : null;

/* ── Test run ────────────────────────────────────────────────────────────── */

async function main() {
  console.log(`${C.bold}Backend contract test${C.reset}`);
  console.log(`${C.dim}Target:    ${BASE}${C.reset}`);
  console.log(`${C.dim}Mutations: ${RUN_MUTATIONS ? "on" : "off (pass --mutations to enable)"}${C.reset}`);

  section("Health");
  const health = await check("GET /health (root, outside /api)", "GET", "/health", {
    keys: KEYS.health,
  }, { base: ROOT_BASE });
  await check("GET /api/health", "GET", "/health", { keys: KEYS.health });

  if (!health) {
    console.log(
      `\n${C.red}The API is not answering. Start the backend and the database, then re-run.${C.reset}`,
    );
    return finish();
  }

  section("Dashboard & analytics");
  await check("GET /api/dashboard", "GET", "/dashboard", { keys: KEYS.overview });
  await check("GET /api/analytics/overview", "GET", "/analytics/overview", {
    keys: KEYS.overview,
  });
  await check("GET /api/analytics/funnel", "GET", "/analytics/funnel", {
    keys: KEYS.funnel,
  });
  await check("GET /api/analytics/channels", "GET", "/analytics/channels", {
    envelope: true,
    keys: KEYS.channelItem,
  });

  section("Reports");
  await check("GET /api/reports/pipeline", "GET", "/reports/pipeline", {
    keys: KEYS.pipeline,
  });
  await check("GET /api/reports/workload", "GET", "/reports/workload", {
    keys: KEYS.workload,
  });
  await check(
    "GET /api/reports/campaign-performance",
    "GET",
    "/reports/campaign-performance",
    { envelope: true, keys: KEYS.campaignReportItem },
  );

  section("Collections");
  const customers = await check("GET /api/customers", "GET", "/customers?limit=5", {
    list: true,
    keys: KEYS.customer,
  });
  const leads = await check("GET /api/leads", "GET", "/leads?limit=5", {
    list: true,
    keys: KEYS.lead,
  });
  const campaigns = await check("GET /api/campaigns", "GET", "/campaigns?limit=5", {
    list: true,
    keys: KEYS.campaign,
  });
  const products = await check("GET /api/products", "GET", "/products?limit=5", {
    list: true,
    keys: KEYS.product,
  });
  const calls = await check("GET /api/calls", "GET", "/calls?limit=5", {
    list: true,
    keys: KEYS.call,
  });
  const tasks = await check("GET /api/tasks", "GET", "/tasks?limit=5", {
    list: true,
    keys: KEYS.task,
  });
  // No GET /followups/{id} route exists, so nothing is captured from this list.
  await check("GET /api/followups", "GET", "/followups?limit=5", {
    list: true,
    keys: KEYS.followup,
  });

  section("Collection filters");
  await check("GET /api/calls?status_filter", "GET", "/calls?limit=5&status_filter=completed", {
    list: true,
  });
  await check("GET /api/tasks?status_filter", "GET", "/tasks?limit=5&status_filter=open", {
    list: true,
  });
  await check("GET /api/leads?skip", "GET", "/leads?skip=1&limit=2", { list: true });

  section("Engagement & journey");
  for (const channel of ["whatsapp", "rcs", "email", "website"]) {
    await check(
      `GET /api/engagement/${channel}`,
      "GET",
      `/engagement/${channel}?limit=5`,
      { list: true, keys: KEYS.engagementEvent },
    );
  }
  await check("GET /api/journey/website", "GET", "/journey/website?limit=5", {
    list: true,
    keys: KEYS.websiteEvent,
  });

  section("Data management");
  await check("GET /api/data/quality", "GET", "/data/quality", { keys: KEYS.quality });
  await check("GET /api/data/validation", "GET", "/data/validation", {
    keys: KEYS.validation,
  });
  const history = await check("GET /api/data/history", "GET", "/data/history?limit=5", {
    list: true,
    keys: KEYS.importJob,
  });

  section("ML catalogue");
  const models = await check("GET /api/ml/models", "GET", "/ml/models?limit=5", {
    list: true,
    keys: KEYS.model,
  });

  /* ── Id-dependent reads ────────────────────────────────────────────────── */

  const customerId = firstId(customers);
  const leadId = firstId(leads);
  const campaignId = firstId(campaigns);
  const productId = firstId(products);
  const callId = firstId(calls);
  const taskId = firstId(tasks);
  const jobId = firstId(history);
  const modelJobId =
    Array.isArray(models?.payload) && models.payload.length > 0
      ? models.payload[0].latest_job_id
      : null;

  section("Single resources");
  const skipEmpty = (op, table) =>
    record("SKIP", op, `no rows in ${table} — expected on a fresh database`);

  if (customerId) {
    await check(`GET /api/customers/${customerId}`, "GET", `/customers/${customerId}`, {
      keys: KEYS.customer,
    });
  } else skipEmpty("GET /api/customers/{id}", "customers");

  if (leadId) {
    await check(`GET /api/leads/${leadId}`, "GET", `/leads/${leadId}`, { keys: KEYS.lead });
  } else skipEmpty("GET /api/leads/{id}", "leads");

  if (campaignId) {
    await check(`GET /api/campaigns/${campaignId}`, "GET", `/campaigns/${campaignId}`, {
      keys: KEYS.campaign,
    });
    await check(
      `GET /api/campaigns/${campaignId}/leads`,
      "GET",
      `/campaigns/${campaignId}/leads?limit=5`,
      { list: true, keys: KEYS.lead },
    );
    await check(
      `GET /api/campaigns/${campaignId}/performance`,
      "GET",
      `/campaigns/${campaignId}/performance`,
      { keys: KEYS.campaignPerformance },
    );
  } else {
    skipEmpty("GET /api/campaigns/{id}", "campaigns");
    skipEmpty("GET /api/campaigns/{id}/leads", "campaigns");
    skipEmpty("GET /api/campaigns/{id}/performance", "campaigns");
  }

  if (productId) {
    await check(`GET /api/products/${productId}`, "GET", `/products/${productId}`, {
      keys: KEYS.product,
    });
  } else skipEmpty("GET /api/products/{id}", "products");

  if (callId) {
    await check(`GET /api/calls/${callId}`, "GET", `/calls/${callId}`, { keys: KEYS.call });
  } else skipEmpty("GET /api/calls/{id}", "calls");

  if (taskId) {
    await check(`GET /api/tasks/${taskId}`, "GET", `/tasks/${taskId}`, { keys: KEYS.task });
  } else skipEmpty("GET /api/tasks/{id}", "tasks");

  if (jobId) {
    await check(`GET /api/data/import/${jobId}`, "GET", `/data/import/${jobId}`, {
      keys: KEYS.importJob,
    });
  } else skipEmpty("GET /api/data/import/{job_id}", "data import jobs");

  if (modelJobId) {
    await check(`GET /api/ml/train/${modelJobId}`, "GET", `/ml/train/${modelJobId}`, {
      keys: KEYS.trainingJob,
    });
  } else skipEmpty("GET /api/ml/train/{job_id}", "ml training jobs");

  section("Lead lifecycle reads");
  if (leadId) {
    await check(`GET /api/leads/${leadId}/details`, "GET", `/leads/${leadId}/details`, {
      keys: KEYS.leadDetails,
    });
    await check(`GET /api/leads/${leadId}/timeline`, "GET", `/leads/${leadId}/timeline`, {
      list: true,
      keys: KEYS.timelineEvent,
    });
    await check(
      `GET /api/leads/${leadId}/journey`,
      "GET",
      `/leads/${leadId}/journey?limit=5`,
      { list: true, keys: KEYS.websiteEvent },
    );
    await check(`GET /api/leads/${leadId}/calls`, "GET", `/leads/${leadId}/calls?limit=5`, {
      list: true,
      keys: KEYS.call,
    });
    await check(`GET /api/leads/${leadId}/outcomes`, "GET", `/leads/${leadId}/outcomes`, {
      list: true,
      keys: KEYS.outcome,
    });
    await check(`GET /api/journey/leads/${leadId}`, "GET", `/journey/leads/${leadId}`, {
      keys: KEYS.journeySummary,
    });
    await check(`GET /api/ai/leads/${leadId}`, "GET", `/ai/leads/${leadId}`, {
      list: true,
      keys: KEYS.predictionLog,
    });
    await check(`GET /api/decision/leads/${leadId}`, "GET", `/decision/leads/${leadId}`, {
      list: true,
      keys: KEYS.decisionLog,
    });
  } else {
    for (const op of [
      "GET /api/leads/{id}/details",
      "GET /api/leads/{id}/timeline",
      "GET /api/leads/{id}/journey",
      "GET /api/leads/{id}/calls",
      "GET /api/leads/{id}/outcomes",
      "GET /api/journey/leads/{id}",
      "GET /api/ai/leads/{id}",
      "GET /api/decision/leads/{id}",
    ]) {
      skipEmpty(op, "leads");
    }
  }

  if (customerId) {
    await check(`GET /api/ai/customers/${customerId}`, "GET", `/ai/customers/${customerId}`, {
      list: true,
      keys: KEYS.predictionLog,
    });
    await check(
      `GET /api/decision/customers/${customerId}`,
      "GET",
      `/decision/customers/${customerId}`,
      { list: true, keys: KEYS.decisionLog },
    );
  } else {
    skipEmpty("GET /api/ai/customers/{id}", "customers");
    skipEmpty("GET /api/decision/customers/{id}", "customers");
  }

  section("Error contract");
  // The UI distinguishes "missing" from "backend down"; 404 must stay a 404.
  await check("GET /api/leads/999999999 → 404", "GET", "/leads/999999999", {}, {
    expect: [404],
  });
  await check("GET /api/leads?limit=0 → 422", "GET", "/leads?limit=0", {}, {
    expect: [422],
  });

  if (!RUN_MUTATIONS) {
    console.log(
      `\n${C.dim}Write routes not exercised. Re-run with --mutations to cover POST/PATCH/DELETE.${C.reset}`,
    );
    return finish();
  }

  await runMutations({ leadId });
  return finish();
}

/* ── Write coverage ──────────────────────────────────────────────────────── */

async function runMutations({ leadId }) {
  section("Writes — reference data");
  const stamp = Date.now();

  const product = await check(
    "POST /api/products",
    "POST",
    "/products",
    { keys: KEYS.product },
    {
      expect: [201],
      body: {
        CRM_Product_Code: `TEST_P_${stamp}`,
        CRM_Product_Name: "Contract test product",
      },
    },
  );
  const newProductId = product?.payload?.id ?? null;

  if (newProductId) {
    await check(
      `PATCH /api/products/${newProductId}`,
      "PATCH",
      `/products/${newProductId}`,
      { keys: KEYS.product },
      { body: { name: "Contract test product (renamed)" } },
    );
  }

  const campaign = await check(
    "POST /api/campaigns",
    "POST",
    "/campaigns",
    { keys: KEYS.campaign },
    {
      expect: [201],
      body: {
        code: `TEST_C_${stamp}`,
        CRM_UTM_Campaign: "Contract test campaign",
        CRM_UTM_Source: "contract-test",
      },
    },
  );
  const newCampaignId = campaign?.payload?.id ?? null;

  if (newCampaignId) {
    await check(
      `PATCH /api/campaigns/${newCampaignId}`,
      "PATCH",
      `/campaigns/${newCampaignId}`,
      { keys: KEYS.campaign },
      { body: { status: "paused" } },
    );
  }

  section("Writes — customer and lead");
  const customer = await check(
    "POST /api/customers",
    "POST",
    "/customers",
    { keys: KEYS.customer },
    {
      expect: [201],
      body: {
        Customer_ID: `TEST_CUST_${stamp}`,
        CRM_Gender: "Unknown",
        CRM_Age_Band: "26-35",
        CRM_Income_Band: "5-10L",
      },
    },
  );
  const newCustomerId = customer?.payload?.id ?? null;

  if (newCustomerId) {
    await check(
      `PATCH /api/customers/${newCustomerId}`,
      "PATCH",
      `/customers/${newCustomerId}`,
      { keys: KEYS.customer },
      { body: { CRM_Occupation: "Contract test" } },
    );
  }

  let newLeadId = null;
  if (newCustomerId) {
    const lead = await check(
      "POST /api/leads",
      "POST",
      "/leads",
      { keys: KEYS.lead },
      {
        expect: [201],
        body: {
          customer_id: newCustomerId,
          campaign_id: newCampaignId ?? undefined,
          CRM_Channel: "contract-test",
          CRM_Data_Medium: "automated",
          Label_Source_Lead_Status: "new",
          priority: "medium",
        },
      },
    );
    newLeadId = lead?.payload?.id ?? null;

    if (newLeadId) {
      await check(
        `PATCH /api/leads/${newLeadId}`,
        "PATCH",
        `/leads/${newLeadId}`,
        { keys: KEYS.lead },
        { body: { status: "qualified", priority: "high" } },
      );
    }
  } else {
    record("SKIP", "POST /api/leads", "customer creation failed, cannot attach a lead");
  }

  section("Writes — lifecycle");
  if (newLeadId) {
    await check(
      `POST /api/leads/${newLeadId}/assign`,
      "POST",
      `/leads/${newLeadId}/assign`,
      { keys: KEYS.assignment },
      { body: { to_section: "tele_sales", to_handler: "contract-test", reason: "automated check" } },
    );
    await check(
      `POST /api/leads/${newLeadId}/transfer`,
      "POST",
      `/leads/${newLeadId}/transfer`,
      { keys: KEYS.assignment },
      { body: { to_section: "retention", to_handler: "contract-test-2", reason: "automated check" } },
    );
    await check(
      `POST /api/leads/${newLeadId}/outcomes`,
      "POST",
      `/leads/${newLeadId}/outcomes`,
      { keys: KEYS.outcome },
      {
        expect: [201],
        body: {
          action_type: "call",
          outcome_code: "interested",
          outcome_label: "Contract test outcome",
          followup_required: true,
        },
      },
    );
    // The outcome above should have written timeline entries and a follow-up.
    await check(
      `GET /api/leads/${newLeadId}/timeline (after writes)`,
      "GET",
      `/leads/${newLeadId}/timeline`,
      { list: true, keys: KEYS.timelineEvent },
    );
  } else {
    for (const op of ["assign", "transfer", "outcomes"]) {
      record("SKIP", `POST /api/leads/{id}/${op}`, "no test lead available");
    }
  }

  section("Writes — operational records");
  const task = await check(
    "POST /api/tasks",
    "POST",
    "/tasks",
    { keys: KEYS.task },
    {
      expect: [201],
      body: {
        Label_Source_Disposition: "Contract test task",
        description: "Created by api-contract-test.mjs",
        lead_id: newLeadId ?? undefined,
        priority: "low",
      },
    },
  );
  const newTaskId = task?.payload?.id ?? null;

  if (newTaskId) {
    await check(
      `PATCH /api/tasks/${newTaskId}`,
      "PATCH",
      `/tasks/${newTaskId}`,
      { keys: KEYS.task },
      { body: { status: "in_progress" } },
    );
  }

  const followup = await check(
    "POST /api/followups",
    "POST",
    "/followups",
    { keys: KEYS.followup },
    {
      expect: [201],
      body: {
        channel: "call",
        lead_id: newLeadId ?? undefined,
        task_id: newTaskId ?? undefined,
        Label_Basis: "Contract test follow-up",
      },
    },
  );
  const newFollowupId = followup?.payload?.id ?? null;

  if (newFollowupId) {
    await check(
      `PATCH /api/followups/${newFollowupId}`,
      "PATCH",
      `/followups/${newFollowupId}`,
      { keys: KEYS.followup },
      { body: { status: "completed" } },
    );
  }

  const call = await check(
    "POST /api/calls",
    "POST",
    "/calls",
    { keys: KEYS.call },
    {
      expect: [201],
      body: {
        lead_id: newLeadId ?? undefined,
        customer_id: newCustomerId ?? undefined,
        phone_number: "+910000000000",
        notes: "Contract test call",
      },
    },
  );
  const newCallId = call?.payload?.id ?? null;

  if (newCallId) {
    await check(
      `PATCH /api/calls/${newCallId}`,
      "PATCH",
      `/calls/${newCallId}`,
      { keys: KEYS.call },
      { body: { notes: "Contract test call (updated)" } },
    );
    await check(
      `POST /api/calls/${newCallId}/start`,
      "POST",
      `/calls/${newCallId}/start`,
      { keys: KEYS.call },
      { body: {} },
    );
    const ended = await check(
      `POST /api/calls/${newCallId}/end`,
      "POST",
      `/calls/${newCallId}/end`,
      { keys: KEYS.call },
      { body: { notes: "Ended by contract test" } },
    );
    // duration_seconds is surfaced as CDR_Avg_Talk_Sec and drives the UI's
    // call-duration column, so confirm the backend actually derived it.
    if (ended && ended.payload?.CDR_Avg_Talk_Sec === null) {
      record(
        "FAIL",
        "POST /api/calls/{id}/end derives duration",
        "CDR_Avg_Talk_Sec is null after start+end",
      );
    } else if (ended) {
      record(
        "PASS",
        "POST /api/calls/{id}/end derives duration",
        `CDR_Avg_Talk_Sec=${ended.payload?.CDR_Avg_Talk_Sec}`,
      );
    }
  }

  section("Writes — AI & decision");
  const aiLeadId = newLeadId ?? leadId;
  if (aiLeadId) {
    for (const type of [
      "validity",
      "intent",
      "conversion",
      "product-recommendation",
      "lead-score",
      "segment",
      "next-best-action",
    ]) {
      await check(
        `POST /api/ai/${type}`,
        "POST",
        `/ai/${type}`,
        { keys: KEYS.prediction },
        { body: { lead_id: aiLeadId } },
      );
    }
    await check(
      "POST /api/ai/analyze-lead",
      "POST",
      "/ai/analyze-lead",
      { keys: KEYS.analysis },
      { body: { lead_id: aiLeadId } },
    );
    await check(
      "POST /api/decision/next-action",
      "POST",
      "/decision/next-action",
      { keys: KEYS.decision },
      { body: { lead_id: aiLeadId } },
    );
  } else {
    record("SKIP", "POST /api/ai/*", "no lead available to score");
    record("SKIP", "POST /api/decision/next-action", "no lead available to score");
  }

  section("Writes — data & ML");
  await check(
    "POST /api/data/export",
    "POST",
    "/data/export",
    { keys: KEYS.exportResult },
    { expect: [201], body: { resource: "leads", file_format: "json" } },
  );

  if (RUN_TRAINING) {
    await check(
      "POST /api/ml/train",
      "POST",
      "/ml/train",
      { keys: KEYS.trainingJob },
      { expect: [201], body: { model_name: "lead_conversion_baseline" } },
    );
  } else {
    record("SKIP", "POST /api/ml/train", "pass --train to run a training job");
  }

  // POST /api/data/import needs a server-side file path, which this script
  // cannot know; it is covered by the backend's own preload script instead.
  record("SKIP", "POST /api/data/import", "needs a server-side source path");

  section("Cleanup");
  // Reverse creation order so foreign keys stay satisfied.
  const cleanup = [
    ["DELETE /api/calls/{id}", newCallId, `/calls/${newCallId}`],
    ["DELETE /api/tasks/{id}", newTaskId, `/tasks/${newTaskId}`],
    ["DELETE /api/leads/{id}", newLeadId, `/leads/${newLeadId}`],
    ["DELETE /api/customers/{id}", newCustomerId, `/customers/${newCustomerId}`],
    ["DELETE /api/campaigns/{id}", newCampaignId, `/campaigns/${newCampaignId}`],
    ["DELETE /api/products/{id}", newProductId, `/products/${newProductId}`],
  ];

  for (const [op, id, path] of cleanup) {
    if (!id) {
      record("SKIP", op, "nothing was created to remove");
      continue;
    }
    await check(op, "DELETE", path, {}, { expect: [204] });
  }

  // The backend exposes no DELETE for follow-ups, so this row is left behind.
  if (newFollowupId) {
    record(
      "SKIP",
      "DELETE /api/followups/{id}",
      `no delete route exists; follow-up #${newFollowupId} left in place`,
    );
  }
}

/* ── Exit ────────────────────────────────────────────────────────────────── */

function finish() {
  const passed = results.filter((r) => r.outcome === "PASS").length;
  const failed = results.filter((r) => r.outcome === "FAIL");
  const skipped = results.filter((r) => r.outcome === "SKIP").length;

  console.log(`\n${C.bold}Summary${C.reset}`);
  console.log(
    `  ${C.green}${passed} passed${C.reset}  ${
      failed.length ? C.red : C.dim
    }${failed.length} failed${C.reset}  ${C.yellow}${skipped} skipped${C.reset}`,
  );

  if (failed.length) {
    console.log(`\n${C.red}${C.bold}Failures${C.reset}`);
    for (const failure of failed) {
      console.log(`  ${C.red}✗${C.reset} ${failure.op}\n    ${C.dim}${failure.detail}${C.reset}`);
    }
  }

  if (JSON_OUT) {
    writeFileSync(
      JSON_OUT,
      JSON.stringify(
        { target: BASE, mutations: RUN_MUTATIONS, passed, failed: failed.length, skipped, results },
        null,
        2,
      ),
    );
    console.log(`\n${C.dim}Report written to ${JSON_OUT}${C.reset}`);
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(`\n${C.red}Test run crashed:${C.reset}`, error);
  process.exit(2);
});
