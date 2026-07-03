import { NextRequest, NextResponse } from 'next/server';
import {
  createTransaction,
  listTransactions,
  getTransactionById,
} from '@/lib/dynamodb';
import { logAuditEvent } from '@/lib/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const userId = searchParams.get('userId');

    await logAuditEvent({
      action: 'LIST_TRANSACTIONS',
      resource: 'transactions',
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
    });

    if (transactionId) {
      const transaction = await getTransactionById(transactionId);
      if (!transaction) {
        return NextResponse.json(
          { error: 'المعاملة غير موجودة' },
          { status: 404 }
        );
      }
      return NextResponse.json({ transaction });
    }

    const result = await listTransactions(userId ?? undefined);
    return NextResponse.json({
      transactions: result.transactions,
      count: result.count,
    });
  } catch (error) {
    console.error('[GET /api/transactions] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المعاملات' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, currency, description } = body as {
      userId?: string;
      amount?: number;
      currency?: string;
      description?: string;
    };

    if (!userId || amount === undefined || !currency) {
      return NextResponse.json(
        { error: 'معرف المستخدم والمبلغ والعملة مطلوبة' },
        { status: 400 }
      );
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'المبلغ يجب أن يكون رقماً موجباً' },
        { status: 400 }
      );
    }

    const allowedCurrencies = ['SAR', 'USD', 'EUR'];
    if (!allowedCurrencies.includes(currency.toUpperCase())) {
      return NextResponse.json(
        { error: 'العملة غير مدعومة. العملات المدعومة: SAR, USD, EUR' },
        { status: 400 }
      );
    }

    const transaction = await createTransaction({
      userId,
      amount,
      currency: currency.toUpperCase(),
      description,
    });

    await logAuditEvent({
      action: 'CREATE_TRANSACTION',
      resource: 'transactions',
      resourceId: transaction.transactionId,
      ipAddress: request.headers.get('x-forwarded-for') ?? 'unknown',
      metadata: { amount, currency },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/transactions] error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المعاملة' },
      { status: 500 }
    );
  }
}
