# نهج | Nahj Financial Platform

Nahj is a production-ready Next.js application for Arabic-first financial management workflows. The app is designed around Saudi hosting and compliance requirements, with AWS Riyadh region defaults, DynamoDB-backed APIs, audit logging, Docker support, and CI/CD automation.

## Stack

- Next.js App Router
- TypeScript + Tailwind CSS
- AWS SDK v3
- DynamoDB + Secrets Manager
- Docker + Docker Compose
- GitHub Actions CI/CD

## Features

- Arabic RTL landing page and dashboard
- Health endpoint for runtime verification
- Users API backed by DynamoDB
- Transactions API backed by DynamoDB GSI queries
- Centralized AWS client configuration
- Audit logging helper for security events
- Standalone Next.js output for container deployment
- Security headers enabled globally

## Project Structure

```text
app/
  api/
    health/route.ts
    transactions/route.ts
    users/route.ts
  dashboard/page.tsx
  globals.css
  layout.tsx
  page.tsx
lib/
  audit.ts
  aws.ts
  dynamodb.ts
public/
  favicon.svg
  hero.png
  icons.svg
.github/workflows/ci.yml
Dockerfile
docker-compose.yml
next.config.js
serverless.yml
```

## Local Development

1. Copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000`.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `AWS_REGION` | AWS region, defaults to `me-central-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key for hosted or local AWS usage |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for hosted or local AWS usage |
| `DYNAMODB_USERS_TABLE` | Users table name |
| `DYNAMODB_TRANSACTIONS_TABLE` | Transactions table name |
| `DYNAMODB_ENDPOINT` | Optional local DynamoDB endpoint |
| `NEXT_PUBLIC_APP_NAME` | Client-visible application name |

## API Endpoints

### `GET /api/health`
Returns service status, version, region, and compliance metadata.

### `GET /api/users?limit=20`
Lists users from DynamoDB.

### `POST /api/users`
Creates a user.

Request body:
```json
{
  "name": "أحمد",
  "email": "ahmad@example.com",
  "phone": "+966500000000"
}
```

### `GET /api/transactions?userId=<id>&limit=20`
Lists recent transactions for a user.

### `POST /api/transactions`
Creates a transaction.

Request body:
```json
{
  "userId": "user-123",
  "type": "income",
  "amount": 5000,
  "description": "راتب",
  "category": "salary"
}
```

## Docker

Run the app with local DynamoDB services:

```bash
docker compose up --build
```

Services:
- App: `http://localhost:3000`
- DynamoDB Local: `http://localhost:8000`
- DynamoDB Admin: `http://localhost:8001`

## Deployment

### Vercel
GitHub Actions builds and deploys the app to Vercel for `develop` and `main`.

### AWS Infrastructure
`serverless.yml` provisions:
- Users DynamoDB table
- Transactions DynamoDB table
- IAM permissions for DynamoDB, Secrets Manager, and CloudWatch Logs

## Security and Compliance

- Global response security headers
- AWS Riyadh region defaults for PDPL-aligned residency
- DynamoDB tables configured with encryption and point-in-time recovery
- Audit helper for structured security logging

## Notes

- Preserved design reference: `نهج.txt`
- Preserved icons: `public/favicon.svg`, `public/icons.svg`
- Preserved hero asset moved to: `public/hero.png`
- Next.js was pinned to a patched secure release because the requested `14.2.5` version is flagged by GitHub Advisory data
