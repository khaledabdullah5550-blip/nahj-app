/**
 * Cloudflare Worker — المستشار المالي الذكي التفاعلي لتطبيق نهج
 * يدعم محادثة حقيقية متعددة الأدوار (مو رد واحد بس) باستخدام Google Gemini المجاني
 */

const PERSONA_AR = `أنت "مساعد"، محلل مالي شخصي داخل تطبيق نهج. أنت مو نظام تقارير آلي — أنت خبير مالي واثق، يحلل وضع المستخدم بعمق ويبادر بالنصح، مو بس ينفّذ أوامر.

طريقة تفكيرك وكلامك:
- **حازم وتحليلي، مو عاطفي**: لما تشوف نمط إنفاق خطر (تجاوز ميزانية، فئة تستهلك نسبة كبيرة، تباطؤ بتحقيق هدف)، قوله بصراحة ومباشرة، بدون تخفيف مبالغ فيه
- **استباقي دائمًا**: لا تنتظر يسأل — إذا شفت رقم يستاهل تنبيه بالبيانات المرفقة، ابدأ فيه أنت
- استخدم بيانات المستخدم الفعلية بكل رد (دخله، مصاريفه، أهدافه)، واحسب له أرقام ملموسة (مثلًا: "بمعدلك الحالي بتوصل لهدفك بعد X شهر")
- لك رأي واضح تقوله بثقة، لكن اسأل المستخدم عن رأيه وأولوياته كمان قبل ما تفترض
- دافئ بالأسلوب مو بالمضمون: تتكلم كصديق يهتم، لكن كلامك المالي دقيق وحازم
- تتذكر سياق المحادثة كاملة، ولا تكرر نفس الكلام
- لا تستخدم رموز Markdown مثل ** أو # أو قوائم مرقّمة — كلام طبيعي متصل

⛔ حد صارم وغير قابل للتفاوض: لا تنصح إطلاقًا بأداة استثمار محددة (سهم، صندوق، عملة رقمية، عقار كاستثمار). لو سأل المستخدم عن استثمار محدد، وضّح إن هذا يحتاج مستشار مالي مرخّص من الجهات الرسمية، وارجع لدورك: تحليل ميزانيته وإنفاقه وادخاره`;

const PERSONA_EN = `You are "Assistant", a personal financial analyst inside the Nahj app. You are not an automated reporting system — you are a confident financial expert who analyzes deeply and proactively advises, not just executes commands.

How you think and speak:
- **Firm and analytical, not emotional**: when you spot a risky pattern (budget overrun, a category eating a large share, slow progress on a goal), say it plainly and directly, without excessive softening
- **Always proactive**: don't wait to be asked — if the attached data shows something worth flagging, bring it up yourself
- Use the user's real data in every reply, and compute concrete numbers (e.g. "at your current rate, you'll reach this goal in X months")
- You have clear opinions and state them confidently, but also ask for the user's own priorities before assuming
- Warm in tone, not in substance: you sound like a friend who cares, but your financial statements are precise and firm
- Remember the full conversation context, don't repeat yourself
- No Markdown symbols like ** or # or numbered lists — natural connected text

⛔ Strict, non-negotiable limit: never recommend a specific investment vehicle (a stock, fund, cryptocurrency, real estate as investment). If asked about a specific investment, clarify that this requires a licensed financial advisor, and return to your role: analyzing their budget, spending, and savings`;

const FIREBASE_WEB_API_KEY = "AIzaSyB7zWGS8lwRHBsomA-O_IH3uEZbb4gIsIc";

async function verifyFirebaseToken(idToken) {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.users?.[0] || null;
  } catch (_) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const ALLOWED_ORIGINS = [
      'https://nahj-app-664f5.web.app',
      'http://localhost:5173',
    ];
    const origin = request.headers.get('Origin') || '';
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const authHeader = request.headers.get('Authorization') || '';
      const idToken = authHeader.replace('Bearer ', '');
      if (!idToken) {
        return new Response(JSON.stringify({ error: 'يجب تسجيل الدخول أولاً' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // تحقق حقيقي: هل هذا الرمز صادر فعليًا من Firebase وصالح، مو بس "موجود"
      const verifiedUser = await verifyFirebaseToken(idToken);
      if (!verifiedUser) {
        return new Response(JSON.stringify({ error: 'جلسة غير صالحة، سجّل دخول من جديد' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const body = await request.json();
      const lang = body.lang === 'en' ? 'en' : 'ar';
      const summary = body.summary || {};
      const history = Array.isArray(body.history) ? body.history : []; // [{role:'user'|'model', text:'...'}]
      const userMessage = body.message || '';

      const nameHint = summary.userName
        ? (lang === 'ar' ? `\n(اسم المستخدم: ${summary.userName} — نادِه باسمه بطبيعية أحيانًا، مو بكل رد)` : `\n(User's name: ${summary.userName} — address them by name naturally sometimes, not every reply)`)
        : '';
      const dataContext = (lang === 'ar'
        ? `بيانات المستخدم الحالية:\n${JSON.stringify(summary)}`
        : `Current user data:\n${JSON.stringify(summary)}`) + nameHint;

      const langForce = lang === 'ar'
        ? '\n\n[تعليمة إلزامية: مهما كانت لغة الرسائل السابقة، أجب على هذي الرسالة بالعربية فقط]'
        : '\n\n[Mandatory instruction: regardless of the language of previous messages, respond to this message in English only]';

      const contents = [
        ...history.map((h) => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: `${dataContext}\n\n${userMessage}${langForce}` }] },
      ];

      async function callGemini(model) {
        return fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: lang === 'ar' ? PERSONA_AR : PERSONA_EN }] },
              contents,
              generationConfig: {
                maxOutputTokens: 500,
                thinkingConfig: { thinkingBudget: 0 },
              },
            }),
          }
        );
      }

      const RETRYABLE = [429, 503];
      let response = await callGemini('gemini-2.5-flash-lite');

      // إعادة محاولة تلقائية لو النموذج مزدحم أو خدمة Google متوقفة مؤقتًا
      if (RETRYABLE.includes(response.status)) {
        await new Promise((r) => setTimeout(r, 2000));
        response = await callGemini('gemini-2.5-flash-lite');
      }

      // لسا فاشل؟ جرب نموذج بديل (gemini-2.5-flash) قبل ما نستسلم كليًا
      if (RETRYABLE.includes(response.status)) {
        response = await callGemini('gemini-2.5-flash');
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini API error:', errText);
        const busyMsg = response.status === 429
          ? (lang === 'ar' ? 'المستشار مزدحم شوي الحين، جرب بعد ثواني 🙏' : "Assistant's a bit busy right now, try again in a few seconds 🙏")
          : (lang === 'ar' ? 'تعذّر الحصول على رد من المستشار' : 'Could not reach the assistant');
        return new Response(JSON.stringify({ error: busyMsg }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const reply = parts.map((p) => p.text || '').join('').trim();

      if (!reply) {
        const blockReason = data.promptFeedback?.blockReason;
        console.error('Empty Gemini reply. Full response:', JSON.stringify(data));
        return new Response(JSON.stringify({
          error: blockReason ? `Blocked: ${blockReason}` : 'Empty response from model',
        }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'حدث خطأ، حاول لاحقًا' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
