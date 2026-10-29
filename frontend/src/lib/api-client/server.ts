import "server-only";
import { headers } from "next/headers";

// Every API failure, as documented in docs/frontend-architecture.md.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string[]> = {},
    // Seconds, from Retry-After on 429.
    readonly retryAfter: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  // Guest/staff session token from the BFF cookie.
  token?: string | null;
};

// The visitor's IP for the API's rate limits. Only an address appended by our
// own reverse proxies can be trusted: with TRUSTED_PROXY_HOPS proxies in front
// of Next, the visitor is that many entries from the right of X-Forwarded-For.
// Anything further left (or the whole header with no proxy) is whatever the
// client sent, so with 0 hops nothing is forwarded.
function visitorIp(forwardedFor: string | null) {
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? "0");
  if (!forwardedFor || !Number.isInteger(hops) || hops < 1) return null;
  const chain = forwardedFor.split(",").map((entry) => entry.trim()).filter(Boolean);
  return chain.length >= hops ? chain[chain.length - hops] : null;
}

// Server-side only: containers reach the API by service name (API_INTERNAL_URL),
// never localhost.
export async function apiFetch<T>(path: string, { method = "GET", body, token }: ApiFetchOptions = {}): Promise<T> {
  const base = process.env.API_INTERNAL_URL;
  if (!base) throw new Error("API_INTERNAL_URL is not set");

  const requestHeaders = new Headers({ accept: "application/json" });
  if (body !== undefined) requestHeaders.set("content-type", "application/json");
  if (token) requestHeaders.set("authorization", `Bearer ${token}`);
  const clientIp = visitorIp((await headers()).get("x-forwarded-for"));
  if (clientIp) requestHeaders.set("x-forwarded-for", clientIp);

  let response: Response;
  try {
    response = await fetch(new URL(path, base), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new ApiError(503, "API_UNREACHABLE", "The service is unavailable. Please try again.");
  }

  if (response.ok) {
    // 202/204 answers (forgot password, logout) have no body.
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
  const error = (await response.json().catch(() => ({}))) as Partial<{
    code: string;
    message: string;
    fieldErrors: Record<string, string[]>;
  }>;
  const retryAfter = Number(response.headers.get("retry-after"));
  throw new ApiError(
    response.status,
    error.code ?? "REQUEST_FAILED",
    error.message ?? "Something went wrong.",
    error.fieldErrors ?? {},
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  );
}
