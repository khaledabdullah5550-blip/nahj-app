# توثيق API - نهج

Base URL: `https://nahj.sa` (Production) | `http://localhost:3000` (Local)

All responses are JSON. All timestamps are ISO 8601 UTC.

---

## GET /api/health

فحص صحة الخادم.

### Response `200`

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "region": "me-central-1",
  "environment": "production",
  "services": {
    "database": "connected",
    "cache": "connected"
  },
  "compliance": {
    "dataResidency": "KSA (me-central-1)",
    "pdpl": "compliant",
    "sama": "compliant"
  }
}
```

---

## Users API

### GET /api/users

جلب قائمة المستخدمين.

**Query Parameters:**

| المعامل | النوع | الافتراضي | الوصف |
|---------|-------|-----------|-------|
| `limit` | number | 20 | عدد النتائج (1-100) |
| `page` | number | 1 | رقم الصفحة |

**Response `200`:**

```json
{
  "data": [
    {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "name": "محمد العتيبي",
      "email": "mohammed@example.com",
      "phone": "0512345678",
      "status": "active",
      "consentGiven": true,
      "consentTimestamp": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z",
      "dataResidency": "KSA"
    }
  ],
  "meta": {
    "count": 1,
    "hasMore": false
  }
}
```

---

### POST /api/users

إنشاء مستخدم جديد.

**Request Body:**

```json
{
  "name": "محمد العتيبي",
  "email": "mohammed@example.com",
  "phone": "0512345678",
  "nationalId": "1234567890",
  "consent": true
}
```

| الحقل | النوع | إلزامي | الوصف |
|-------|-------|--------|-------|
| `name` | string | ✅ | الاسم (2-100 حرف) |
| `email` | string | ✅ | البريد الإلكتروني |
| `phone` | string | ❌ | جوال سعودي (05xxxxxxxx) |
| `nationalId` | string | ❌ | رقم الهوية (10 أرقام) |
| `consent` | boolean | ✅ | يجب أن يكون `true` (PDPL) |

**Response `201`:**

```json
{
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "محمد العتيبي",
    "email": "mohammed@example.com",
    "status": "active",
    "consentGiven": true,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "dataResidency": "KSA"
  }
}
```

**Response `409`** — البريد مسجل مسبقاً:
```json
{ "error": "البريد الإلكتروني مسجل مسبقاً" }
```

---

## Transactions API

### GET /api/transactions

جلب معاملات مستخدم.

**Query Parameters:**

| المعامل | النوع | إلزامي | الوصف |
|---------|-------|--------|-------|
| `userId` | string (UUID) | ✅ | معرّف المستخدم |
| `limit` | number | ❌ | عدد النتائج (1-100) |

**Response `200`:**

```json
{
  "data": [
    {
      "transactionId": "660e8400-e29b-41d4-a716-446655440000",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "type": "credit",
      "amount": 18500.00,
      "currency": "SAR",
      "description": "الراتب الشهري",
      "category": "دخل",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "dataResidency": "KSA"
    }
  ],
  "meta": {
    "count": 1,
    "hasMore": false
  }
}
```

---

### POST /api/transactions

إنشاء معاملة جديدة.

**Request Body:**

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "debit",
  "amount": 2500.00,
  "description": "إيجار شقة",
  "category": "سكن",
  "currency": "SAR",
  "referenceNumber": "REF-2024-001"
}
```

| الحقل | النوع | إلزامي | الوصف |
|-------|-------|--------|-------|
| `userId` | UUID | ✅ | معرّف المستخدم |
| `type` | `credit`\|`debit` | ✅ | نوع المعاملة |
| `amount` | number | ✅ | المبلغ (موجب، حتى 10,000,000) |
| `description` | string | ✅ | وصف المعاملة (2-500 حرف) |
| `category` | string | ✅ | الفئة |
| `currency` | string | ❌ | رمز العملة (افتراضي: SAR) |
| `referenceNumber` | string | ❌ | رقم المرجع |

**Response `201`:**

```json
{
  "data": {
    "transactionId": "660e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "type": "debit",
    "amount": 2500.00,
    "currency": "SAR",
    "status": "completed",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "dataResidency": "KSA"
  }
}
```

---

## أكواد الأخطاء

| الكود | الوصف |
|-------|-------|
| `400` | طلب غير صحيح — تحقق من الحقول |
| `404` | المورد غير موجود |
| `409` | تعارض — البريد مسجل مسبقاً |
| `500` | خطأ داخلي في الخادم |

جميع أخطاء الـ validation تحتوي على وصف عربي مفصّل:

```json
{
  "error": "email: البريد الإلكتروني غير صحيح, consent: يجب الموافقة على سياسة الخصوصية (PDPL)"
}
```
