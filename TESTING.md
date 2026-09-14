# Live integration test runbook

How to verify the frontend against a running backend and a real database.
Everything below assumes a **fresh database** — empty tables, ids starting at 1.

---

## 1. Bring up the backend

From `backend/`:

```bash
# Postgres. Use docker-compose.yml, NOT docker-compose.dev.yml — see "Known issues".
docker compose -f docker-compose.yml up -d db

# Python environment
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt      # Windows
# .venv/bin/pip install -r requirements.txt        # macOS / Linux

# Schema
.venv/Scripts/alembic upgrade head

# Data. Skip this step if you want to see the frontend's empty states first.
.venv/Scripts/python scripts/preload_sample_data.py --reset

# API
.venv/Scripts/uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Confirm it is up:

```bash
curl http://127.0.0.1:8000/api/health
# {"status":"ok","database":"connected"}
```

> Bind to `127.0.0.1`, not `0.0.0.0`, or set `API_BASE_URL` to match. Node
> resolves `localhost` to `::1` first, and a uvicorn listening only on IPv4
> will refuse that connection on Windows. The frontend defaults to
> `http://127.0.0.1:8000/api` for this reason.

## 2. Point the frontend at it

`frontend/.env.local` (already created; edit only if the backend is elsewhere):

```
API_BASE_URL=http://127.0.0.1:8000/api
API_TIMEOUT_MS=15000
```

`API_BASE_URL` has no `NEXT_PUBLIC_` prefix on purpose — it must never reach the
browser. Client components call the same-origin proxy at `/api/[...path]`
instead, which is what lets this work against a backend that mounts no CORS
middleware.

---

## 3. Contract test

Run against the backend directly:

```bash
cd frontend
npm run test:api                    # every GET route, read-only
npm run test:api:full               # + POST/PATCH/DELETE, creates and cleans up
node scripts/api-contract-test.mjs --mutations --train   # + a real training run
node scripts/api-contract-test.mjs --json=report.json    # machine-readable
```

The harness checks three things per operation:

1. **Status code** — including that a missing lead is a `404` and `limit=0` is a
   `422`, because the UI distinguishes "absent" from "backend down".
2. **Envelope shape** — list routes must return a **bare JSON array**. Only
   `/analytics/channels` and `/reports/campaign-performance` wrap in `items`.
   Getting this wrong would break every table.
3. **Field names** — payload keys must match `src/lib/api/schema.ts` at their
   Excel serialization aliases (`CRM_Channel`, `Label_Source_Lead_Status`,
   `Customer_ID`, `CDR_Avg_Talk_Sec`, `MSG_Engaged`, `Excel_Fields`, …).

**On a fresh, unseeded database** expect a large number of `SKIP` lines. That is
correct: id-dependent checks are skipped rather than failed when a table is
empty. Seed the sample data to turn those into `PASS`.

Exit code is `1` if anything failed, so it drops into CI unchanged.

### Testing through the Next proxy

To verify the proxy route itself (the path client components use), start the
frontend and re-run against it:

```bash
npm run build && npm start        # or: npm run dev
npm run test:api:proxy            # targets http://127.0.0.1:3000/api
```

Both runs should produce the same results. A difference means the proxy is
altering something it should be passing through.

---

## 4. Frontend verification

```bash
npm run verify        # typecheck + lint + production build
npm run dev
```

Then walk the screens. Each one and what it should show against seeded data:

| Route | Expect |
|---|---|
| `/dashboard` | Non-zero totals, funnel bars, channel bars, 8 recent leads |
| `/leads` | Lead table with Customer_IDs; search and status filter work; paging via `?page=` |
| `/leads/<id>` | Customer bands, attribution, engagement, timeline, calls/tasks/follow-ups |
| `/pipeline` | Columns summing to the pipeline report total (see note below) |
| `/accounts` | Customers ranked by lead count, plus product and campaign catalogues |
| `/analytics` | Funnel, channels, engagement per channel, campaign conversion table |
| `/workload` | One row per `current_handler` with lead, task and follow-up counts |
| `/reports` | Pipeline and workload figures, campaign table, export panel, job history |
| `/system` | API + database green, table counts, completeness bars, model catalogue |
| `/ai-assistant` | Lead picker; "Run full analysis" returns 7 prediction cards |

### Write paths worth exercising by hand

- `/leads/<id>` → **Assign** and **Transfer**, then confirm new timeline entries.
- `/leads/<id>` → **Record outcome** with "Create a follow-up" ticked; the
  follow-up should appear in the Follow-ups panel and on `/workload`.
- `/leads/<id>` → **Run analysis**, then **Recommend action**.
- `/reports` → **Export** a resource; the returned path is on the API server.
- `/system` → **Start training**, then **Refresh** the job.
- Dashboard **Quick actions** → create a task and a follow-up.

### Checking the offline path

Stop the backend and reload any screen. Every route should still return HTTP 200
with a red "Cannot reach the API server" banner — not a stack trace, and not an
error page. This has been verified; it is worth re-checking after any change to
`src/lib/api/client.ts`.

---

## 5. Things that are expected, not bugs

**Pipeline columns vs. the reported total.** The backend's funnel and pipeline
reports group by `Lead.status` lowercased but only name four buckets
(`new`, `qualified`, `converted`, `lost`), while `total_leads` counts *every*
status. Any lead with another status lands in the UI's **Other** column, and the
funnel chart adds a line accounting for the difference. If the four named
buckets do not sum to the total, that is the backend's arithmetic, faithfully
displayed.

**Pipeline board is a sample above 500 leads.** List routes cap `limit` at 500,
so the board loads at most 500 cards while the totals strip covers the whole
table. The page says so when that happens.

**Conversion rates.** The backend returns these as fractions (`0.326`), not
percentages. The adapters multiply by 100 exactly once. A figure like `3260%`
would mean a double conversion somewhere.

**No names, contact details or monetary values anywhere.** The source dataset is
anonymized: a `Customer_ID` plus banded demographics. Any screen showing a
person's name or a rupee figure would be fabricating it.

**Follow-ups are not deleted during cleanup.** The backend exposes no
`DELETE /api/followups/{id}`, so `--mutations` leaves one follow-up row behind
and reports it as a SKIP.

---

## Known issues in the backend (not modified)

These were found while wiring the frontend and are left for you to decide on —
no backend files were changed.

1. **No CORS middleware.** `app/core/config.py` defines
   `allowed_origins: ["*"]`, but `app/main.py` never mounts `CORSMiddleware`.
   The frontend works around this by routing every call server-side, so nothing
   is blocked — but a browser client could not call the API directly.

2. **`docker-compose.dev.yml` has two defects**, which is why the runbook uses
   `docker-compose.yml`:
   - port binding `"0.0.0:5432:5432"` — malformed IP address;
   - volume target `/var/lib/postgresql/dat` — truncated `/data`, so the volume
     would not actually persist Postgres data.
