import { NextRequest } from "next/server";
import { API_BASE_URL } from "@/lib/api/client";

/**
 * Same-origin pass-through to the FastAPI backend.
 *
 * The backend mounts no CORSMiddleware, so the browser cannot call :8000
 * directly. Client components call `/api/<path>` on this origin instead and
 * this handler relays it, keeping the backend URL out of the browser bundle.
 * The frontend path mirrors the backend's `/api` prefix 1:1.
 *
 * Server Components do not go through here — they call `lib/api/endpoints`
 * directly and save the extra hop.
 */

/** Methods the backend actually exposes. */
const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

/** Response headers worth relaying; everything else is hop-by-hop noise. */
const FORWARDED_RESPONSE_HEADERS = ["content-type"];

/**
 * Written out rather than using the global `RouteContext` helper, whose types
 * only exist after `next typegen`/`dev`/`build` — a fresh clone would not typecheck.
 */
type ProxyContext = { params: Promise<{ path: string[] }> };

async function proxy(
  request: NextRequest,
  context: ProxyContext,
): Promise<Response> {
  if (!ALLOWED_METHODS.has(request.method)) {
    return Response.json(
      { detail: `Method ${request.method} is not supported` },
      { status: 405 },
    );
  }

  const { path } = await context.params;

  // Reject traversal so this can only ever address the backend's own routes.
  if (path.some((segment) => segment === ".." || segment === ".")) {
    return Response.json({ detail: "Invalid path" }, { status: 400 });
  }

  const target = `${API_BASE_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  const contentType = request.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;

  // `duplex` is required by undici whenever a body is streamed.
  const hasBody = request.method === "POST" || request.method === "PATCH";
  const body = hasBody ? await request.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: body || undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(Number(process.env.API_TIMEOUT_MS ?? 15_000)),
    });
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "TimeoutError";
    return Response.json(
      {
        detail: timedOut
          ? "The backend did not respond in time."
          : `Cannot reach the backend at ${API_BASE_URL}. Is it running?`,
      },
      { status: 504 },
    );
  }

  // 204 carries no body and must not be given one.
  if (upstream.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseHeaders = new Headers();
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
