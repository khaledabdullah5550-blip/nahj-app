import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { createUser, getUserByEmail, listUsers } from '@/lib/dynamodb';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';
import {
  CreateUserSchema,
  QuerySchema,
  parseRequestBody,
  parseQueryParams,
} from '@/lib/validation';
import { withAuth } from '@/lib/withAuth';
import { rateLimiters } from '@/lib/ratelimit';
import type { User } from '@/lib/dynamodb';

// GET /api/users - List users (authenticated)
export const GET = withAuth(async (request: NextRequest) => {
  const ip = getClientIP(request);
  const rl = rateLimiters.listUsers.limit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'طلبات كثيرة - حاول لاحقاً' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  const { searchParams } = new URL(request.url);

  const queryResult = parseQueryParams(searchParams, QuerySchema);
  if (queryResult.data === null) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const { limit } = queryResult.data;

  try {
    const result = await listUsers(limit);

    // Strip nationalId and passwordHash from all responses (PDPL data minimisation)
    const safeItems = result.items.map(
      ({ nationalId: _nid, passwordHash: _ph, ...rest }) => rest
    );

    await logAuditEvent('USERS_LISTED', {
      resourceType: 'User',
      ipAddress: ip,
      userAgent: getUserAgent(request),
      success: true,
      metadata: { count: result.count },
      pdplCategory: 'personal_data',
    });

    return NextResponse.json({
      data: safeItems,
      meta: {
        count: result.count,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
  } catch (error) {
    await logAuditEvent('USERS_LISTED', {
      resourceType: 'User',
      ipAddress: ip,
      userAgent: getUserAgent(request),
      success: false,
      errorMessage: String(error),
    });

    console.error('خطأ في جلب المستخدمين:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
});

// POST /api/users - Create / register user (public — no withAuth so anyone can register)
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimiters.createUser.limit(ip);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'طلبات كثيرة - حاول لاحقاً' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  const parseResult = await parseRequestBody(request, CreateUserSchema);
  if (parseResult.data === null) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 });
  }

  const { name, email, password, phone, nationalId, consent } = parseResult.data;

  try {
    // Prevent duplicate registrations
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مسجل مسبقاً' },
        { status: 409 }
      );
    }

    const now = new Date().toISOString();
    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 12);

    const user: User = {
      userId,
      name,
      email,
      phone,
      nationalId,
      passwordHash,
      status: 'active',
      consentGiven: consent,
      consentTimestamp: now,
      createdAt: now,
      updatedAt: now,
      dataResidency: 'KSA',
    };

    const created = await createUser(user);

    await logAuditEvent('USER_CREATED', {
      userId,
      resourceType: 'User',
      resourceId: userId,
      ipAddress: ip,
      userAgent: getUserAgent(request),
      success: true,
      metadata: { email },
      pdplCategory: 'personal_data',
    });

    // Strip sensitive fields before returning (PDPL - data minimisation)
    const { nationalId: _nid, passwordHash: _ph, ...safeUser } = created;
    void _nid;

    return NextResponse.json(
      { data: safeUser as Omit<User, 'nationalId' | 'passwordHash'> },
      { status: 201 }
    );
  } catch (error) {
    await logAuditEvent('USER_CREATED', {
      resourceType: 'User',
      ipAddress: ip,
      userAgent: getUserAgent(request),
      success: false,
      errorMessage: String(error),
    });

    console.error('خطأ في إنشاء المستخدم:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}
