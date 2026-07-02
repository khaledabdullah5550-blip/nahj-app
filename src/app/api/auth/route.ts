import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rate-limit';
import { passwordSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for') ?? 'local';
  if (isRateLimited(`auth:${key}`, 15, 60_000)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await request.json();
  const valid = passwordSchema.safeParse(body.password ?? '');

  if (!valid.success) {
    return NextResponse.json({ ok: false, error: 'WEAK_PASSWORD' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
