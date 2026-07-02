import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';
import { sanitizeInput, transactionSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for') ?? 'local';
  if (isRateLimited(`transactions:${key}`, 30, 60_000)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await request.json();
  const parsed = transactionSchema.safeParse({
    ...body,
    amount: Number(body.amount),
    category: sanitizeInput(body.category ?? ''),
    description: sanitizeInput(body.description ?? ''),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_TRANSACTION' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, transaction: parsed.data });
}
