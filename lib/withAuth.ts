import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedSession {
  userId: string;
  email: string;
  name?: string;
}

/**
 * Wrapper that enforces authentication on API route handlers.
 * The wrapped handler receives a verified session with userId.
 *
 * Usage:
 *   export const GET = withAuth(async (req, session) => {
 *     // session.userId is guaranteed
 *   });
 */
export function withAuth(
  handler: (req: NextRequest, session: AuthenticatedSession) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'غير مصرَّح - يجب تسجيل الدخول' },
        { status: 401 }
      );
    }

    return handler(req, {
      userId: session.user.id,
      email: session.user.email!,
      name: session.user.name ?? undefined,
    });
  };
}
