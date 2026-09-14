# Lead Intelligence — Frontend

Next.js 16 (App Router) client for the FastAPI lead-intelligence backend.

## Quick start

```bash
npm install
cp .env.example .env.local     # already present; edit if the backend is elsewhere
npm run dev                    # http://localhost:3000
```

The backend must be running for any data to appear. With it stopped, every
screen still renders and shows a "Cannot reach the API server" banner rather
than failing. See [TESTING.md](./TESTING.md) for the full runbook.

## How data reaches the UI

```
Server Component ──┐
                   ├──► lib/api/endpoints ──► lib/api/client ──► FastAPI :8000/api
Client Component ──┴──► /api/[...path] ─────┘        (server-only)
```

The backend mounts no CORS middleware, so the browser cannot call it directly.
Every request originates on the Next.js server: Server Components call the
endpoint layer directly, and Client Components go through a same-origin proxy
that mirrors the backend's `/api` prefix 1:1. `API_BASE_URL` is server-only and
never enters the browser bundle.

| Layer | Path | Responsibility |
|---|---|---|
| Transport | `src/lib/api/client.ts` | Base URL, timeouts, `ApiError` normalization, cache policy |
| Proxy | `src/app/api/[...path]/route.ts` | Same-origin relay for Client Components |
| Contract | `src/lib/api/schema.ts` | TypeScript types for every backend model |
| Routes | `src/lib/api/endpoints.ts` | One function per backend operation (62 paths / 82 operations) |
| Adapters | `src/lib/api/adapters.ts` | Wire → view model. The only place derivation happens |
| Loaders | `src/dal/*.ts` | Per-screen reads; `actions.ts` holds the writes |

### Response field names

The backend's Pydantic models declare Excel aliases and FastAPI serializes by
alias, so `LeadRead.source_channel` arrives on the wire as `CRM_Channel`.
`schema.ts` mirrors the **wire** names. Request bodies are asymmetric: `*Create`
models accept the aliases, `*Update` models (PATCH) take snake_case.

List routes return **bare JSON arrays**. Only `/analytics/channels` and
`/reports/campaign-performance` are enveloped in `items`.

### Build-time safety

`client.ts` calls `connection()` before every uncached fetch, which keeps data
pages request-time. `next build` therefore succeeds with the backend offline —
every data-backed route is marked `ƒ (Dynamic)` rather than being prerendered
against an API that is not running.

## Screens

| Route | Backend routes |
|---|---|
| `/dashboard` | `/dashboard`, `/analytics/funnel`, `/analytics/channels`, `/reports/workload`, `/leads` |
| `/leads` | `/leads`, `/customers` |
| `/leads/[leadId]` | `/leads/{id}/details` and the lifecycle, AI and decision writes |
| `/pipeline` | `/reports/pipeline`, `/leads` |
| `/accounts` | `/customers`, `/leads`, `/products`, `/campaigns` |
| `/analytics` | `/analytics/*`, `/reports/campaign-performance`, `/engagement/*` |
| `/workload` | `/reports/workload`, `/leads`, `/tasks`, `/followups` |
| `/reports` | `/reports/*`, `/data/export`, `/data/history` |
| `/system` | `/health`, `/data/quality`, `/data/validation`, `/ml/*` |
| `/ai-assistant` | `/ai/*`, `/decision/next-action` |

## What the data does and does not contain

The source dataset is anonymized. Customers are a `Customer_ID` plus banded
demographics (age band, income band, occupation, education). There are **no**
names, email addresses, phone numbers, premiums or revenue figures, and no user
or team records — lead ownership is the `current_handler` string on the lead.
The UI shows the fields that exist rather than synthesizing the ones that do not.

## Scripts

```bash
npm run dev            # development server
npm run verify         # typecheck + lint + production build
npm run test:api       # contract-test every GET route against the backend
npm run test:api:full  # also exercise writes, with cleanup
npm run test:api:proxy # run the same suite through the Next proxy
```
