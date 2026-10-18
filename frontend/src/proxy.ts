import { NextResponse, type NextRequest } from "next/server";
import { internalPrefix, resolveHost } from "@/lib/tenant/hosts";

// Rewrites each host to its internal app segment (central, site/[host],
// backoffice, admin). Requests that already include a prefix get it twice
// and 404, so internal paths cannot be reached directly.
// Auth checks added here later are optimistic only; the API enforces.
export function proxy(request: NextRequest) {
  const target = resolveHost(request.headers.get("host") ?? "");
  const url = request.nextUrl.clone();
  const path = url.pathname === "/" ? "" : url.pathname;
  url.pathname = `${internalPrefix(target)}${path}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, route handlers under /api and files with an extension.
  matcher: ["/((?!api/|_next/|.*\\..*).*)"],
};
