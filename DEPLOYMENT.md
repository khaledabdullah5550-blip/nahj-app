# دليل النشر - نهج

## المتطلبات

- Node.js 20+
- AWS CLI مُعدّ مع صلاحيات IAM
- حساب Vercel (اختياري للـ frontend)
- Serverless Framework: `npm install -g serverless`

---

## 1. إعداد AWS

### 1.1 إنشاء IAM User

```bash
# في AWS Console → IAM → Users → Create User
# اسم المستخدم: nahj-deploy
# أضف الصلاحيات التالية:
# - AmazonDynamoDBFullAccess
# - AWSLambdaFullAccess
# - IAMFullAccess
# - CloudFormationFullAccess
# - AmazonAPIGatewayAdministrator
# - CloudWatchFullAccess
# - AWSKeyManagementServicePowerUser
```

### 1.2 تعيين المنطقة

```bash
aws configure
# AWS Access Key ID: [مفتاحك]
# AWS Secret Access Key: [مفتاحك السري]
# Default region name: me-central-1   ← مهم جداً للـ PDPL
# Default output format: json
```

---

## 2. نشر DynamoDB

```bash
# نشر البنية التحتية (Staging)
serverless deploy --stage staging

# نشر الإنتاج
serverless deploy --stage production
```

سيتم إنشاء:
- `nahj-staging-users` — جدول المستخدمين
- `nahj-staging-transactions` — جدول المعاملات
- `nahj-staging-audit-logs` — سجلات المراجعة
- KMS Key للتشفير

---

## 3. متغيرات البيئة

```bash
# انسخ القالب
cp .env.local.example .env.local

# عدّل القيم الإلزامية:
AWS_REGION=me-central-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
DYNAMODB_USERS_TABLE=nahj-staging-users
DYNAMODB_TRANSACTIONS_TABLE=nahj-staging-transactions
DYNAMODB_AUDIT_TABLE=nahj-staging-audit-logs
```

---

## 4. نشر Frontend (Vercel)

```bash
# تثبيت Vercel CLI
npm install -g vercel

# تسجيل الدخول
vercel login

# نشر (Staging)
vercel

# نشر (Production)
vercel --prod
```

أضف متغيرات البيئة في Vercel Dashboard:
- `AWS_REGION` = `me-central-1`
- `DYNAMODB_USERS_TABLE` = `nahj-production-users`
- إلخ…

---

## 5. التطوير المحلي (Docker)

```bash
# تشغيل كل الخدمات
docker-compose up

# التحقق من الصحة
curl http://localhost:3000/api/health

# فتح DynamoDB Admin
open http://localhost:8001
```

---

## 6. CI/CD (GitHub Actions)

### إعداد الأسرار في GitHub

في GitHub → Settings → Secrets → Actions:

```
VERCEL_TOKEN           = رمز Vercel
VERCEL_ORG_ID          = معرف المنظمة
VERCEL_PROJECT_ID      = معرف المشروع
AWS_ACCESS_KEY_ID_STAGING      = مفتاح AWS (Staging)
AWS_SECRET_ACCESS_KEY_STAGING  = المفتاح السري (Staging)
AWS_ACCESS_KEY_ID_PROD         = مفتاح AWS (Production)
AWS_SECRET_ACCESS_KEY_PROD     = المفتاح السري (Production)
```

### تدفق النشر

| الفرع | البيئة | التلقائي |
|-------|--------|---------|
| `develop` | Staging | ✅ |
| `main` | Production | ✅ |
| `feature/*` | — | Lint + Build فقط |

---

## 7. التحقق من النشر

```bash
# Health check
curl https://nahj.sa/api/health

# اختبار API
curl -X GET https://nahj.sa/api/users \
  -H "Content-Type: application/json"

# إنشاء مستخدم تجريبي
curl -X POST https://nahj.sa/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "محمد العتيبي",
    "email": "test@example.com",
    "phone": "0512345678",
    "consent": true
  }'
```

---

## 8. المراقبة

- **CloudWatch**: `/nahj/{stage}/app`
- **Lambda Metrics**: AWS Console → Lambda → Monitor
- **DynamoDB Metrics**: AWS Console → DynamoDB → Monitor
- **Error Alarm**: يُرسل تنبيه عند تجاوز 10 أخطاء في 5 دقائق
