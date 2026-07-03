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
import type { Transaction } from '@/lib/dynamodb';

// GET /api/transactions - List transactions for a user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'معامل userId مطلوب' },
      { status: 400 }
    );
  }

  const queryResult = parseQueryParams(searchParams, QuerySchema);
  if (queryResult.data === null) {
    return NextResponse.json({ error: queryResult.error }, { status: 400 });
  }

  const { limit } = queryResult.data;

  try {
    const result = await listTransactionsByUser(userId, limit);

    await logAuditEvent('TRANSACTIONS_LISTED', {
      userId,
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
      userId,
      resourceType: 'Transaction',
      ipAddress: getClientIP(request),
      userAgent: getUserAgent(request),
      success: false,
      errorMessage: String(error),
    });

    console.error('خطأ في جلب المعاملات:', error);
    return NextResponse.json({ error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// POST /api/transactions - Create a transaction
export async function POST(request: NextRequest) {
  const parseResult = await parseRequestBody(request, CreateTransactionSchema);
  if (parseResult.data === null) {
    return NextResponse.json({ error: parseResult.error }, { status: 400 });
  }

  const { userId, type, amount, currency, description, category, referenceNumber } =
    parseResult.data;

  try {
    const now = new Date().toISOString();
    const transactionId = uuidv4();

    const transaction: Transaction = {
      transactionId,
      userId,
      type,
      amount,
      currency,
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
}
