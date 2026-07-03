import { NextRequest, NextResponse } from 'next/server';
import { getUserById, listUsers, createUser } from '@/lib/dynamodb';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    await logAuditEvent({
      action: 'LIST_USERS',
      resource: 'users',
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    if (userId) {
      const user = await getUserById(userId);
      if (!user) {
        return NextResponse.json(
          { error: 'المستخدم غير موجود' },
          { status: 404 }
        );
      }
      return NextResponse.json({ user });
    }

    const result = await listUsers();
    return NextResponse.json({
      users: result.users,
      count: result.count,
    });
  } catch (error) {
    console.error('[GET /api/users] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, nationalId } = body as {
      name?: string;
      email?: string;
      nationalId?: string;
    };

    if (!name || !email) {
      return NextResponse.json(
        { error: 'الاسم والبريد الإلكتروني مطلوبان' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح' },
        { status: 400 }
      );
    }

    const user = await createUser({ name, email, nationalId });

    await logAuditEvent({
      action: 'CREATE_USER',
      resource: 'users',
      resourceId: user.userId,
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/users] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    );
  }
}

function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const atIndex = email.indexOf('@');
  if (atIndex < 1) return false;
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  if (local.length > 64 || domain.length < 4) return false;
  const dotIndex = domain.lastIndexOf('.');
  if (dotIndex < 1 || dotIndex === domain.length - 1) return false;
  return true;
}
