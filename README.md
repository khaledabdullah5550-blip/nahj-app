# نهج - منصة الإدارة المالية

<div align="center">

**منصة إدارة مالية احترافية متوافقة مع PDPL و SAMA**

[![CI/CD](https://github.com/khaledabdullah5550-blip/nahj-app/actions/workflows/ci.yml/badge.svg)](https://github.com/khaledabdullah5550-blip/nahj-app/actions)
[![AWS Region](https://img.shields.io/badge/AWS-me--central--1%20(Riyadh)-orange)](https://aws.amazon.com/about-aws/global-infrastructure/regions_az/)
[![PDPL](https://img.shields.io/badge/PDPL-Compliant-green)](COMPLIANCE.md)
[![SAMA](https://img.shields.io/badge/SAMA-Compliant-green)](COMPLIANCE.md)

</div>

---

## 📋 المحتويات

- [نظرة عامة](#نظرة-عامة)
- [المميزات](#المميزات)
- [التقنيات المستخدمة](#التقنيات-المستخدمة)
- [البدء السريع](#البدء-السريع)
- [البنية المعمارية](#البنية-المعمارية)
- [التوثيق](#التوثيق)
- [الامتثال القانوني](#الامتثال-القانوني)

---

## نظرة عامة

**نهج** منصة إدارة مالية احترافية مبنية على:

- **Next.js 15** مع App Router و TypeScript
- **AWS Lambda** في منطقة الرياض (`me-central-1`)
- **DynamoDB** مشفّر في الرياض
- **Serverless Architecture** بتكلفة $0-30/شهر

---

## المميزات

| الميزة | الوصف |
|--------|-------|
| 🔐 **أمان عالي** | تشفير KMS، HTTPS/TLS 1.3، Security Headers |
| 📍 **بيانات في السعودية** | كل البيانات في Riyadh Region (me-central-1) |
| ✅ **PDPL متوافق** | امتثال كامل لنظام حماية البيانات الشخصية |
| 🏦 **SAMA متوافق** | يستوفي متطلبات البنك المركزي السعودي |
| ⚡ **Serverless** | AWS Lambda مع Auto-scaling وتكلفة حسب الاستخدام |
| 🌙 **Dark Mode** | وضع ليلي كامل |
| 🌍 **RTL** | دعم كامل للغة العربية |
| 📊 **Audit Logging** | تسجيل كامل لجميع العمليات |

---

## التقنيات المستخدمة

### Frontend
- **Next.js 15** - App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling + Dark Mode
- **IBM Plex Sans Arabic** - Arabic Font

### Backend
- **Next.js API Routes** - REST API
- **Zod** - Input Validation
- **AWS SDK v3** - DynamoDB Client

### Infrastructure
- **AWS Lambda** (me-central-1)
- **DynamoDB** (me-central-1)
- **AWS KMS** - Encryption
- **Serverless Framework** - IaC
- **GitHub Actions** - CI/CD

---

## البدء السريع

### 1. استنساخ المشروع

```bash
git clone https://github.com/khaledabdullah5550-blip/nahj-app.git
cd nahj-app
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إعداد المتغيرات البيئية

```bash
cp .env.local.example .env.local
# عدّل القيم في .env.local
```

### 4. تشغيل بيئة التطوير المحلية (مع Docker)

```bash
# تشغيل DynamoDB محلي + التطبيق
docker-compose up

# أو بدون Docker:
npm run dev
```

### 5. الوصول للتطبيق

| الخدمة | الرابط |
|--------|--------|
| التطبيق | http://localhost:3000 |
| لوحة التحكم | http://localhost:3000/dashboard |
| Health Check | http://localhost:3000/api/health |
| DynamoDB Admin | http://localhost:8001 |

---

## البنية المعمارية

```
┌─────────────────────────────────────────────────────────┐
│                    المستخدم النهائي                      │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS/TLS 1.3
┌──────────────────────────▼──────────────────────────────┐
│              Vercel CDN (Edge Network)                   │
│              Next.js 15 + Static Assets                  │
└──────────────────────────┬──────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────┐
│         AWS Lambda - Riyadh (me-central-1)               │
│         ┌─────────────────────────────────────┐         │
│         │  Next.js API Routes                 │         │
│         │  - /api/health                      │         │
│         │  - /api/users                       │         │
│         │  - /api/transactions                │         │
│         └──────────────┬──────────────────────┘         │
└─────────────────────────┼───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│         DynamoDB - Riyadh (me-central-1)                 │
│         ┌──────────────────────────────────┐            │
│         │ nahj-users       (KMS Encrypted) │            │
│         │ nahj-transactions (KMS Encrypted)│            │
│         │ nahj-audit-logs  (TTL + KMS)     │            │
│         └──────────────────────────────────┘            │
│         PDPL Compliant ✅  SAMA Compliant ✅             │
└─────────────────────────────────────────────────────────┘
```

---

## هيكل الملفات

```
nahj-app/
├── app/
│   ├── layout.tsx          # Root Layout (RTL/Arabic)
│   ├── page.tsx            # Landing Page
│   ├── globals.css         # Global Styles
│   ├── dashboard/
│   │   └── page.tsx        # Dashboard
│   └── api/
│       ├── health/route.ts # Health Check
│       ├── users/route.ts  # Users CRUD
│       └── transactions/
│           └── route.ts    # Transactions CRUD
├── lib/
│   ├── aws.ts              # AWS SDK Config
│   ├── dynamodb.ts         # DynamoDB Helpers
│   ├── audit.ts            # Audit Logging
│   └── validation.ts       # Input Validation (Zod)
├── public/                 # Static Assets
├── serverless.yml          # Infrastructure as Code
├── docker-compose.yml      # Local Dev
├── Dockerfile              # Container
├── .github/workflows/ci.yml # CI/CD
├── .env.local.example      # Environment Template
├── next.config.js          # Security Headers
├── tailwind.config.ts      # Tailwind + Arabic
├── tsconfig.json           # TypeScript Strict
├── DEPLOYMENT.md           # Deploy Guide
├── COMPLIANCE.md           # PDPL/SAMA
└── API.md                  # API Docs
```

---

## التوثيق

| الوثيقة | الوصف |
|---------|-------|
| [DEPLOYMENT.md](DEPLOYMENT.md) | دليل النشر على AWS |
| [API.md](API.md) | توثيق الـ API |
| [COMPLIANCE.md](COMPLIANCE.md) | PDPL + SAMA Compliance |

---

## الامتثال القانوني

- ✅ **PDPL** - نظام حماية البيانات الشخصية السعودي
- ✅ **SAMA** - متطلبات البنك المركزي السعودي
- ✅ **Data Residency** - كل البيانات في الرياض
- ✅ **Encryption** - تشفير KMS في وضع الراحة والنقل
- ✅ **Audit Trail** - تسجيل جميع العمليات
- ✅ **Data Deletion** - حذف البيانات عند الطلب (PDPL Art. 18)

---

## التكلفة التقديرية

| الخدمة | التكلفة الشهرية |
|--------|----------------|
| AWS Lambda | $0-5 |
| DynamoDB | $0-10 |
| CloudFront | $0-5 |
| CloudWatch | $0-3 |
| Vercel (Frontend) | مجاني |
| **المجموع** | **~$0-23/شهر** |

---

## الترخيص

MIT License

---

<div align="center">

**نهج** - بناء المستقبل المالي في السعودية 🇸🇦

</div>
