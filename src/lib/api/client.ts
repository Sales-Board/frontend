import "server-only";
import { connection } from "next/server";

/**
 * Server-side transport for the FastAPI backend.
 *
 * This module is `server-only` on purpose. The backend mounts no CORSMiddleware
 * (see backend `app/main.py`), so a browser can never call it directly — every
 * request has to originate from the Next.js server. Client components reach the
 * API through the same-origin proxy at `src/app/api/[...path]/route.ts`.
 */

/**
 * Default to 127.0.0.1 rather than `localhost`: Node resolves `localhost` to
 * ::1 first, and uvicorn bound to IPv4 refuses that connection on Windows.
 */
export const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

/** Upstream is a local FastAPI process; a slow response means something is wrong. */
const DEFAULT_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 15_000);

/** A single FastAPI 422 validation entry. */
export interface ValidationDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * Normalized failure from the backend. `status === 0` means the request never
 * reached the server (connection refused, DNS, timeout) as opposed to an HTTP
 * error, which the UI reports differently: "backend is down" vs "request failed".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly route: string;
  readonly detail: string | ValidationDetail[] | null;

  constructor(
    message: string,
    options: {
      status: number;
      route: string;
      detail?: string | ValidationDetail[] | null;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.status = options.status;
    this.route = options.route;
    this.detail = options.detail ?? null;
  }

  /** True when the backend process could not be reached at all. */
  get isUnreachable(): boolean {
    return this.status === 0;
  }

  /** True when the resource is simply absent — expected against a fresh database. */
  get isNotFound(): boolean {
    return this.status === 404;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Appended as a query string; null/undefined entries are dropped. */
  query?: Record<string, QueryValue>;
  /** JSON request body. Serialized automatically. */
  body?: unknown;
  /**
   * Cache lifetime in seconds. Omit for live operational data, which is always
   * fetched fresh. Only reference data (products, campaigns) sets this.
   */
  revalidate?: number;
  /** Cache tags, so a mutation can invalidate the reads it affects. */
  tags?: string[];
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(
    `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`,
  );
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Pull a readable message out of FastAPI's `{detail}` / 422 detail array. */
function describeDetail(detail: unknown): string | null {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return (
      detail
        .map((entry) => {
          if (entry && typeof entry === "object" && "msg" in entry) {
            const item = entry as ValidationDetail;
            const field = Array.isArray(item.loc)
              ? item.loc.filter((p) => p !== "body").join(".")
              : "";
            return field ? `${field}: ${item.msg}` : item.msg;
          }
          return String(entry);
        })
        .join("; ") || null
    );
  }
  return null;
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(path, options.query);
  const route = `${method} ${path}`;
  const isCached = typeof options.revalidate === "number";

  // Marks this as request-time work so a page never calls the backend during
  // `next build` — the API server is not running then, and a prerender attempt
  // would fail the build rather than the request.
  if (!isCached) {
    await connection();
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      ...(isCached
        ? { next: { revalidate: options.revalidate, tags: options.tags } }
        : { cache: "no-store" as const }),
    });
  } catch (cause) {
    const reason =
      cause instanceof Error && cause.name === "TimeoutError"
        ? `timed out after ${DEFAULT_TIMEOUT_MS}ms`
        : "could not be reached";
    throw new ApiError(
      `API ${reason} at ${API_BASE_URL}. Is the backend running?`,
      { status: 0, route, cause },
    );
  }

  // 204 from DELETE routes, and any other genuinely empty body.
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      // Non-JSON body: only possible on an unhandled server error page.
      if (!response.ok) {
        throw new ApiError(`${route} failed (${response.status})`, {
          status: response.status,
          route,
          detail: raw.slice(0, 500),
        });
      }
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail: string | ValidationDetail[] }).detail
        : null;
    throw new ApiError(
      describeDetail(detail) ?? `${route} failed (${response.status})`,
      { status: response.status, route, detail },
    );
  }

  return payload as T;
}

export const apiGet = <T>(path: string, options?: RequestOptions) =>
  request<T>("GET", path, options);

export const apiPost = <T>(path: string, options?: RequestOptions) =>
  request<T>("POST", path, options);

export const apiPatch = <T>(path: string, options?: RequestOptions) =>
  request<T>("PATCH", path, options);

export const apiDelete = <T = void>(path: string, options?: RequestOptions) =>
  request<T>("DELETE", path, options);

/**
 * Runs a read and returns `fallback` instead of throwing when the resource is
 * absent or the backend is down. Dashboards aggregate many independent reads;
 * one empty table on a fresh database should not blank the whole page.
 */
export async function tolerate<T>(
  promise: Promise<T>,
  fallback: T,
): Promise<{ data: T; error: ApiError | null }> {
  try {
    return { data: await promise, error: null };
  } catch (error) {
    if (error instanceof ApiError) {
      return { data: fallback, error };
    }
    throw error;
  }
}
