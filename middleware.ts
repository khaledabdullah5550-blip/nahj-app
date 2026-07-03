import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware:
 * 1. Generates a per-request CSP nonce and sets the Content-Security-Policy header
 *    (replaces the static unsafe-inline from next.config.js).
 * 2. Protects all /api/* routes (except /api/auth/* and /api/health) by requiring
 *    a valid NextAuth JWT token.
 */
export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(uuidv4()).toString('base64');

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const { pathname } = request.nextUrl;

  // Protect API routes — skip auth and health (health is for load-balancer probes)
  const isProtectedAPI =
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/auth/') &&
    pathname !== '/api/health';

  if (isProtectedAPI) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { error: 'غير مصرَّح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }
  }

  // Forward nonce to page components via request header so they can inject it
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);

  return response;
}

export const config = {
  // Run on all paths except static assets
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
