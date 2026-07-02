import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';
import { sanitizeInput } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for') ?? 'local';
  if (isRateLimited(`budgets:${key}`, 20, 60_000)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await request.json();
  const category = sanitizeInput(body.category ?? '');
  const limit = Number(body.limit ?? 0);
  const month = sanitizeInput(body.month ?? '');

  if (!category || !month || !Number.isFinite(limit) || limit <= 0) {
    return NextResponse.json({ error: 'INVALID_BUDGET' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, budget: { category, limit, month } });
}
