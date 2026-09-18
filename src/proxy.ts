import { NextResponse, type NextRequest } from "next/server";

/**
 * Protects /admin with HTTP Basic Auth. This is a minimal MVP guard — swap
 * for real session-based auth before storing anything sensitive behind it.
 */
export function proxy(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // If no password is configured, keep /admin inaccessible rather than open.
  if (!adminPassword) {
    return new NextResponse("Admin is not configured.", { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const [, password] = decoded.split(":");
    if (password === adminPassword) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="FlyDealFinder Admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
