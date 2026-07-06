# نهج (Nahj) — نسخة React + Firebase

## 🧩 ماذا يحتوي هذا المشروع
- واجهة React (Vite) مطابقة لهوية "نهج" البصرية
- تسجيل دخول حقيقي عبر **Firebase Authentication** (بريد إلكتروني + كلمة مرور، مع استعادة كلمة المرور)
- تخزين البيانات في **Firestore** (كل مستخدم يرى بياناته فقط — راجع `firestore.rules`)
- مستشار مالي بالذكاء الاصطناعي عبر **Cloud Function** وسيطة (مفتاح API لا يظهر أبدًا في المتصفح)
- محلل رسائل بنكية يعمل محليًا بالكامل داخل المتصفح (لا يُرسل نص الرسالة لأي خادم)

---

## 1) التشغيل محليًا للتجربة

```bash
npm install
npm run dev
```

بيفتح على `http://localhost:5173` — جرّبه بمتصفحك أولاً.

> ملاحظة: ميزة "المستشار الذكي" ما راح تشتغل محليًا إلا بعد نشر الـ Cloud Function (الخطوة 4)، لأنها تعتمد عليها.

---

## 2) تثبيت أدوات Firebase (مرة وحدة على جهازك)

```bash
npm install -g firebase-tools
firebase login
```

بيفتح لك متصفح تسجّل دخول فيه بنفس حساب Google المرتبط بمشروع `nahj-app-664f5`.

---

## 3) تفعيل Authentication في لوحة Firebase

1. افتح [console.firebase.google.com](https://console.firebase.google.com) → مشروع `nahj-app-664f5`
2. من القائمة الجانبية: **Build → Authentication → Get started**
3. فعّل **Email/Password** كطريقة تسجيل دخول

---

## 4) نشر قواعد الأمان + دالة الذكاء الاصطناعي

**أولاً، خزّن مفتاح Anthropic API بشكل سري (مرة وحدة):**
```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```
بيطلب منك تلصق المفتاح — هذا المفتاح **لا يوضع بالكود إطلاقًا** ولا يُرفع لـ GitHub.

**بعدين انشر القواعد والدالة:**
```bash
firebase deploy --only firestore:rules,functions
```

---

## 5) نشر الموقع نفسه (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```

بعد النشر بيعطيك نفس الرابط (`nahj-app-664f5.web.app`) لكن بالنسخة الجديدة الشغالة فعليًا.

---

## 6) خطوات لاحقة (بعد التجربة والاعتماد الداخلي)

### النشر في المتاجر (App Store / Google Play)
هذا المشروع حاليًا تطبيق ويب. لتحويله لتطبيق جوال حقيقي بدون إعادة كتابة الكود من الصفر، الخيار الأنسب هو **Capacitor** (يغلّف نفس كود React في تطبيق iOS/Android):
```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
```
يتطلب بعدها: حساب Apple Developer (99$/سنة) وحساب Google Play Console (25$ رسوم لمرة وحدة)، وهذي خطوات تسجيل رسمية لازم تسويها أنت بهويتك أو هوية شركتك.

### الاستضافة داخل السعودية
Firebase Hosting حاليًا يخزن على خوادم Google العالمية. لو المتطلب النظامي يفرض تخزين البيانات داخل السعودية فعليًا (خصوصًا بعد أي ترخيص من ساما مستقبلًا)، الخيار البديل وقتها هو الانتقال لقاعدة بيانات مستضافة محليًا (مثل STC Cloud) بدل Firestore — وهذا قرار يُتخذ بعد الاستشارة القانونية، مو قبلها.

### قبل أي إطلاق تجاري فعلي
- استشارة قانونية متخصصة بخصوص ترخيص ساما ومتطلبات PDPL
- تدقيق أمني مستقل (Penetration Testing) على قواعد Firestore والدوال
- سياسة خصوصية وشروط استخدام معتمدة قانونيًا

---

## 🗂️ هيكل المشروع
```
nahj-react/
├── src/
│   ├── firebase.js         ← إعدادات مشروعك الفعلي
│   ├── i18n.js              ← نصوص عربي/إنجليزي
│   ├── App.jsx              ← إدارة حالة الدخول
│   └── components/
│       ├── Login.jsx
│       └── Dashboard.jsx
├── functions/
│   └── index.js             ← دالة المستشار الذكي الآمنة
├── firestore.rules          ← قواعد الأمان (مهم جدًا)
└── firebase.json
```
