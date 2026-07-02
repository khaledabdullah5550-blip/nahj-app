import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const proto = request.headers.get('x-forwarded-proto');

  if (process.env.NODE_ENV === 'production' && proto && proto !== 'https') {
    const httpsUrl = request.nextUrl.clone();
    httpsUrl.protocol = 'https';
    return NextResponse.redirect(httpsUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
