import "server-only";
import { tolerate } from "@/lib/api/client";
import * as api from "@/lib/api/endpoints";
import type { MLModelSummary } from "@/lib/api/schema";
import { collectIssues, toIssue } from "./shared";
import type { LoadIssue, SystemStatus } from "./types";

export interface SystemView {
  status: SystemStatus;
  models: MLModelSummary[];
  issues: LoadIssue[];
}

/**
 * System screen — connection health, data integrity and the model catalogue.
 *
 * GET /api/health          API liveness and database reachability
 * GET /api/data/quality    per-table row counts and field completeness
 * GET /api/data/validation active data-integrity issues
 * GET /api/ml/models       trained model catalogue
 *
 * Training is triggered by the `trainModel` server action (POST /api/ml/train).
 */
export async function getSystemView(): Promise<SystemView> {
  const [health, quality, validation, models] = await Promise.all([
    tolerate(api.getHealth(), { status: "unreachable", database: "unknown" }),
    tolerate(api.getDataQuality(), {
      generated_at: "",
      table_counts: {},
      completeness: {},
    }),
    tolerate(api.getDataValidation(), {
      generated_at: "",
      total_issues: 0,
      issues: [],
    }),
    tolerate(api.listModels({ limit: 50 }), []),
  ]);

  return {
    status: {
      apiReachable: health.error === null,
      databaseStatus: health.data.database,
      tableCounts: Object.entries(quality.data.table_counts ?? {})
        .map(([table, count]) => ({ table, count }))
        .sort((a, b) => b.count - a.count),
      // `completeness` is reported as a fraction per field, scaled here for display.
      completeness: Object.entries(quality.data.completeness ?? {})
        .map(([field, value]) => ({ field, pct: value * 100 }))
        .sort((a, b) => a.pct - b.pct),
      issues: validation.data.issues ?? [],
      totalIssues: validation.data.total_issues,
      generatedAt: quality.data.generated_at || null,
    },
    models: models.data,
    issues: collectIssues(
      toIssue("health", health.error),
      toIssue("data/quality", quality.error),
      toIssue("data/validation", validation.error),
      toIssue("ml/models", models.error),
    ),
  };
}
