import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createTransaction, listTransactionsByUser } from '@/lib/dynamodb';
import { logAuditEvent, getClientIP, getUserAgent } from '@/lib/audit';
import {
  CreateTransactionSchema,
  QuerySchema,
  parseRequestBody,
  parseQueryParams,
} from '@/lib/validation';
import { withAuth } from '@/lib/withAuth';
import { rateLimiters } from '@/lib/ratelimit';
import type { Transaction } from '@/lib/dynamodb';
import type { AuthenticatedSession } from '@/lib/withAuth';

// GET /api/transactions - List transactions for the authenticated user
export const GET = withAuth(async (request: NextRequest, session: AuthenticatedSession) => {
  const { searchParams } = new URL(request.url);

  // Rate-limit by userId
  const rl = rateLimiters.listTransactions.limit(session.userId);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'طلبات كثيرة - حاول لاحقاً' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  // Authorization: if a userId param is provided it must match the session
  const queriedUserId = searchParams.get('userId');
  if (queriedUserId && queriedUserId !== session.userId) {
    return NextResponse.json(
      { error: 'غير مسموح - لا يمكن الوصول لبيانات مستخدم آخر' },
      { status: 403 }
    );
  }

  const queryResult = parseQueryParams(searchParams, QuerySchema);
  if (queryResult.data === null) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const { limit } = queryResult.data;

  try {
    // Always use the session userId — never trust the query param for data access
    const result = await listTransactionsByUser(session.userId, limit);

    await logAuditEvent('TRANSACTIONS_LISTED', {
      userId: session.userId,
      resourceType: 'Transaction',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      success: true,
      metadata: { count: result.count },
      pdplCategory: 'financial_data',
    });

    return NextResponse.json({
      data: result.items,
      meta: {
        count: result.count,
        hasMore: !!result.lastEvaluatedKey,
      },
    });
  } catch (error) {
    await logAuditEvent('TRANSACTIONS_LISTED', {
      userId: session.userId,
      resourceType: 'Transaction',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      success: false,
      errorMessage: String(error),
    });

    console.error('خطأ في جلب المعاملات:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
});

// POST /api/transactions - Create a transaction for the authenticated user
export const POST = withAuth(async (request: NextRequest, session: AuthenticatedSession) => {
  // Rate-limit by userId
  const rl = rateLimiters.createTransaction.limit(session.userId);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'طلبات كثيرة - حاول لاحقاً' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  const parseResult = await parseRequestBody(request, CreateTransactionSchema);
  if (parseResult.data === null) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 });
  }

  const { type, amount, currency, description, category, referenceNumber } = parseResult.data;
  // Always use session userId — ignore any userId from the request body
  const userId = session.userId;

  try {
    const now = new Date().toISOString();
    const transactionId = uuidv4();

    const transaction: Transaction = {
      transactionId,
      userId,
      type,
      amount,
      currency: currency ?? 'SAR',
      description,
      category,
      referenceNumber,
      status: 'completed',
      createdAt: now,
      updatedAt: now,
      dataResidency: 'KSA',
    };

    const created = await createTransaction(transaction);

    await logAuditEvent('TRANSACTION_CREATED', {
      userId,
      resourceType: 'Transaction',
      resourceId: transactionId,
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      success: true,
      metadata: { type, amount, currency },
      pdplCategory: 'financial_data',
    });

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (error) {
    await logAuditEvent('TRANSACTION_CREATED', {
      userId,
      resourceType: 'Transaction',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      success: false,
      errorMessage: String(error),
    });

    console.error('خطأ في إنشاء المعاملة:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
});
