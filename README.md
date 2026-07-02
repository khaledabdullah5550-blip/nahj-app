# Nahj Financial Platform (Beta MVP)

Production-focused Next.js financial management MVP with Firebase + AI advisor.

## Tech Stack
- Next.js (TypeScript, App Router)
- Firebase Authentication, Firestore, Storage
- OpenAI API (AI advisor)
- Tailwind CSS
- next-i18next + i18next (Arabic/English)

## Features
- Email/password authentication
- Strong password policy (8+, upper/lower/number/special)
- Auto logout after 10 minutes inactivity
- Dashboard with real-time income/expense/net balance
- Transactions CRUD with categories + emoji
- Firestore persistence (users, transactions, budgets)
- Plan tiers (Free/Individuals/Groups/Special Needs)
- AI advisor API with rate limiting and plan checks
- Arabic RTL and English LTR with persisted language preference
- Input validation/sanitization and secure headers

## Project Structure
```
src/
  app/
    api/auth
    api/transactions
    api/budgets
    api/ai-advisor
    (auth)/login
    (auth)/register
    (dashboard)/dashboard
    (dashboard)/transactions
    (dashboard)/settings
  components/
  hooks/
  lib/
  types/
public/locales/{ar,en}/common.json
```

## Environment Variables
Copy `.env.local.example` into `.env.local` and fill:
- `NEXT_PUBLIC_FIREBASE_*` values from Firebase web app settings
- `OPENAI_API_KEY`

## Setup
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Firestore Schema (Beta)
- `users/{userId}/meta/profile`
  - `{ name, email, phone, plan, createdAt, updatedAt }`
- `transactions/{userId}/items/{transactionId}`
  - `{ type, amount, category, description, date, createdAt }`
- `budgets/{userId}/items/{budgetId}`
  - `{ category, limit, spent, month, createdAt }`

## API Endpoints
- `POST /api/auth` — password policy validation + rate limiting
- `POST /api/transactions` — transaction payload validation + rate limiting
- `POST /api/budgets` — budget payload validation + rate limiting
- `POST /api/ai-advisor` — AI advisor response (OpenAI or fallback), rate-limited

## Deployment (Vercel)
1. Import repository in Vercel.
2. Add `.env.local.example` variables in Vercel Project Settings.
3. Deploy.
4. Ensure Firebase rules are restricted to authenticated users.

## Tester Guide
### Demo account
Create once in Firebase Auth for testers:
- Email: `beta.tester@nahj.app`
- Password: `Nahj@2026!`

### Sample data generation
1. Login with demo account.
2. Add a few income and expense transactions.
3. Add at least one budget in Settings.
4. Ask AI advisor a question in Dashboard.

## Architecture Overview
- Client app authenticates with Firebase Auth.
- Transactions and budgets sync in real time with Firestore snapshots.
- AI advisor requests go through secured Next.js API route with validation and rate limiting.
- i18n resources are maintained in `public/locales` and loaded by i18next.
