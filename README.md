# نهج (Nahj) — منصة الخدمات المالية

[![CI/CD Pipeline](https://github.com/khaledabdullah5550-blip/nahj-app/actions/workflows/ci.yml/badge.svg)](https://github.com/khaledabdullah5550-blip/nahj-app/actions/workflows/ci.yml)
[![PDPL Compliant](https://img.shields.io/badge/PDPL-Compliant-green)](https://nahj.sa)
[![SAMA Compliant](https://img.shields.io/badge/SAMA-Compliant-green)](https://nahj.sa)
[![AWS Region](https://img.shields.io/badge/AWS-me--central--1%20(KSA)-orange)](https://aws.amazon.com/local/middle-east/)

## 📋 نظرة عامة

**نهج** هي منصة خدمات مالية احترافية مصممة خصيصاً للسوق السعودية، متوافقة بالكامل مع:

- 🏛️ **هيئة السوق المالية (SAMA)** — متطلبات الأمن والامتثال
- 🔒 **نظام حماية البيانات الشخصية (PDPL)** — إقامة البيانات داخل المملكة
- 🇸🇦 **منطقة AWS الرياض (me-central-1)** — جميع البيانات داخل المملكة العربية السعودية

---

## 🏗️ التقنيات المستخدمة

| التقنية | الإصدار | الغرض |
|---------|---------|-------|
| Next.js | 15.x | إطار العمل الأساسي |
| React | 19.x | واجهة المستخدم |
| TypeScript | 5.x | سلامة الأنواع |
| Tailwind CSS | 3.x | التنسيق |
| AWS DynamoDB | SDK v3 | قاعدة البيانات |
| AWS Secrets Manager | SDK v3 | إدارة الأسرار |

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 20+
- npm 10+
- حساب AWS مع صلاحيات DynamoDB (اختياري للتطوير المحلي)

### التثبيت المحلي

```bash
# 1. استنساخ المستودع
git clone https://github.com/khaledabdullah5550-blip/nahj-app.git
cd nahj-app

# 2. تثبيت الحزم
npm install

# 3. إعداد المتغيرات البيئية
cp .env.local.example .env.local
# عدّل .env.local بالقيم المناسبة

# 4. تشغيل بيئة التطوير
npm run dev
```

التطبيق سيعمل على: http://localhost:3000

### التطوير مع Docker

```bash
# تشغيل كامل البيئة (التطبيق + DynamoDB محلي)
docker-compose up -d

# التطبيق: http://localhost:3000
# DynamoDB Admin: http://localhost:8001
```

---

## 📁 هيكل المشروع

```
nahj-app/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (RTL + Arabic fonts)
│   ├── page.tsx                  # Landing page
│   ├── globals.css               # Global styles (Tailwind + Tajawal)
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard page
│   └── api/
│       ├── health/route.ts       # Health check + compliance info
│       ├── users/route.ts        # Users CRUD
│       └── transactions/route.ts # Transactions CRUD
├── lib/
│   ├── aws.ts                    # AWS SDK clients
│   ├── dynamodb.ts               # DynamoDB helpers + TypeScript interfaces
│   └── audit.ts                  # Audit event logging
├── .github/workflows/ci.yml      # CI/CD pipeline
├── serverless.yml                # Infrastructure as Code
├── Dockerfile                    # Multi-stage Docker build
├── docker-compose.yml            # Local development environment
├── next.config.js                # Next.js + security headers
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript strict config
└── .env.local.example            # Environment variables template
```

---

## 🔌 API Reference

### `GET /api/health`

فحص صحة النظام ومعلومات الامتثال.

**Response:**
```json
{
  "status": "healthy",
  "service": "nahj-app",
  "region": "me-central-1",
  "compliance": {
    "pdpl": { "status": "compliant", "dataResidency": "KSA" },
    "sama": { "status": "compliant", "securityHeaders": true }
  }
}
```

### `GET /api/users`

جلب قائمة المستخدمين.

### `POST /api/users`

إنشاء مستخدم جديد.

**Request Body:**
```json
{ "name": "أحمد محمد", "email": "ahmed@example.sa" }
```

### `GET /api/transactions`

جلب قائمة المعاملات المالية.

### `POST /api/transactions`

إنشاء معاملة مالية جديدة.

**Request Body:**
```json
{ "userId": "uuid", "amount": 1500, "currency": "SAR" }
```

---

## 🔒 الأمن والامتثال

### PDPL (نظام حماية البيانات الشخصية)

- ✅ جميع البيانات محفوظة في منطقة الرياض (`me-central-1`)
- ✅ تشفير البيانات في حالة الراحة (AES-256 + KMS)
- ✅ تشفير البيانات أثناء النقل (TLS 1.3)
- ✅ سجلات تدقيق شاملة لجميع العمليات

### SAMA (هيئة السوق المالية)

- ✅ رؤوس أمان HTTP محكمة (CSP, HSTS, X-Frame-Options)
- ✅ تسجيل ومراقبة النشاط
- ✅ ضوابط وصول دقيقة
- ✅ حماية من هجمات XSS و CSRF

### البنية التحتية

- ✅ DynamoDB مع تشفير KMS
- ✅ Point-in-Time Recovery مفعّل
- ✅ سياسات IAM بمبدأ الصلاحية الأدنى

---

## 🛠️ أوامر التطوير

```bash
npm run dev        # تشغيل بيئة التطوير
npm run build      # بناء نسخة الإنتاج
npm run start      # تشغيل نسخة الإنتاج
npm run lint       # فحص الكود
```

---

## 📦 النشر

### AWS Lambda (Serverless Framework)

```bash
# تثبيت Serverless Framework
npm install -g serverless

# نشر على بيئة الاختبار
npx serverless deploy --stage staging

# نشر على الإنتاج
npx serverless deploy --stage prod
```

### Docker

```bash
# بناء الصورة
docker build -t nahj-app:latest .

# تشغيل الحاوية
docker run -p 3000:3000 \
  -e AWS_REGION=me-central-1 \
  -e AWS_ACCESS_KEY_ID=xxx \
  -e AWS_SECRET_ACCESS_KEY=xxx \
  nahj-app:latest
```

---

## 📊 المتغيرات البيئية

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|------------------|
| `AWS_REGION` | منطقة AWS | `me-central-1` |
| `AWS_ACCESS_KEY_ID` | مفتاح AWS | — |
| `AWS_SECRET_ACCESS_KEY` | سر AWS | — |
| `DYNAMODB_USERS_TABLE` | اسم جدول المستخدمين | `nahj-users` |
| `DYNAMODB_TRANSACTIONS_TABLE` | اسم جدول المعاملات | `nahj-transactions` |
| `DYNAMODB_AUDIT_TABLE` | اسم جدول التدقيق | `nahj-audit-logs` |

---

## 📄 الترخيص

هذا المشروع مملوك لشركة نهج. جميع الحقوق محفوظة.

---

<div dir="ltr">

**Nahj** — Professional Financial Services Platform for the Saudi Market  
Built with ❤️ in 🇸🇦 Saudi Arabia

</div>

