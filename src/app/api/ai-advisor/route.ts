import { NextRequest, NextResponse } from 'next/server';
import { aiMessageSchema, sanitizeInput } from '@/lib/validation';
import { isRateLimited } from '@/lib/rate-limit';
import { getOpenAIClient } from '@/lib/openai';
import { PLAN_LIMITS } from '@/types';

const MAX_CONTEXT_TRANSACTIONS = 150;

export async function POST(request: NextRequest) {
  const key = request.headers.get('x-forwarded-for') ?? 'local';

  if (isRateLimited(`ai:${key}`, 20, 60_000)) {
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await request.json();
  const parsed = aiMessageSchema.safeParse({
    message: sanitizeInput(body.message ?? ''),
    language: body.language,
    plan: body.plan,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }

  if (!PLAN_LIMITS[parsed.data.plan].aiEnabled) {
    return NextResponse.json({ error: 'AI_DISABLED_FOR_PLAN' }, { status: 403 });
  }

  // Keep prompt context bounded for predictable latency/token usage.
  const transactions = Array.isArray(body.transactions) ? body.transactions.slice(0, MAX_CONTEXT_TRANSACTIONS) : [];
  const totalExpense = transactions.filter((item: { type?: string }) => item.type === 'expense').reduce((sum: number, item: { amount?: number }) => sum + Number(item.amount ?? 0), 0);
  const totalIncome = transactions.filter((item: { type?: string }) => item.type === 'income').reduce((sum: number, item: { amount?: number }) => sum + Number(item.amount ?? 0), 0);

  const fallback = parsed.data.language === 'ar'
    ? `ملخص سريع: إجمالي الإيرادات ${totalIncome.toFixed(2)} ريال، والمصروفات ${totalExpense.toFixed(2)} ريال. حاول تقليل أكبر بند مصروف بنسبة 10% لتحسين الرصيد.`
    : `Quick summary: Total income is ${totalIncome.toFixed(2)} SAR and expenses are ${totalExpense.toFixed(2)} SAR. Try reducing your largest expense category by 10% to improve balance.`;

  const client = getOpenAIClient();
  if (!client) {
    return NextResponse.json({ reply: fallback, source: 'fallback' });
  }

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      {
        role: 'system',
        content:
          parsed.data.language === 'ar'
            ? 'أنت مستشار مالي شخصي. قدم نصيحة عملية مختصرة وآمنة مع اقتراح لتحسين الميزانية.'
            : 'You are a personal finance advisor. Provide concise, actionable and safe advice with budgeting suggestions.',
      },
      {
        role: 'user',
        content: `${parsed.data.message}\nIncome:${totalIncome}\nExpense:${totalExpense}`,
      },
    ],
    temperature: 0.4,
    max_tokens: 350,
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || fallback;
  return NextResponse.json({ reply, source: 'openai' });
}
