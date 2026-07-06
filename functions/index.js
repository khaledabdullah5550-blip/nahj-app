const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

// المفتاح يُخزَّن سريًا في Firebase (Secret Manager) وليس في الكود إطلاقًا.
// يُضبط لاحقًا عبر: firebase functions:secrets:set ANTHROPIC_API_KEY
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

exports.getFinancialAdvice = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: 'us-central1' },
  async (request) => {
    // لازم يكون المستخدم مسجل دخول فعليًا حتى يستخدم الميزة
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'يجب تسجيل الدخول أولاً');
    }

    const summary = request.data || {};
    const lang = summary.lang === 'en' ? 'en' : 'ar';
    const langInstruction = lang === 'ar' ? 'أجب باللغة العربية فقط.' : 'Answer in English only.';

    const prompt = `أنت مستشار مالي شخصي لتطبيق سعودي اسمه "نهج". حلل بيانات المستخدم التالية وأعطه في 4-6 أسطر مختصرة: (1) ملاحظة عن نمط إنفاقه هذا الشهر، (2) أعلى فئة إنفاق ونصيحة عملية بخصوصها، (3) توقع بسيط لنهاية الشهر بناءً على المعدل الحالي، (4) نصيحة قصيرة تخص أهداف الادخار إن وجدت. لا تستخدم رموز Markdown مثل ** أو #. ${langInstruction}\n\nبيانات المستخدم:\n${JSON.stringify(summary)}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY.value(),
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 500,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', errText);
        throw new HttpsError('internal', 'تعذّر الحصول على تحليل من الذكاء الاصطناعي');
      }

      const data = await response.json();
      const advice = (data.content || []).map((c) => c.text || '').join('\n').trim();
      return { advice };
    } catch (err) {
      console.error(err);
      throw new HttpsError('internal', 'حدث خطأ أثناء التحليل، حاول لاحقًا');
    }
  }
);
