# Roinet Sales CRM — Frontend

Next.js App Router UI for the Roinet Insurance Brokers Sales CRM.

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

## Routes

| Path | Screen |
|------|--------|
| `/dashboard` | KPIs, charts, recent deals |
| `/leads` | Hot / Warm / Cold kanban |
| `/deals` | Full deals table with filters |
| `/posp` | POSP roster cards |
| `/renewals` | Policies due for renewal |
| `/commissions` | COA and margin by POSP |
| `/reports` | Analytics and policy summary |

## Data layer

Mock data is used by default (`NEXT_PUBLIC_USE_MOCK=true`). The `src/lib/api/` module exposes `crmApi` — swap to `httpCrmApi` when the backend is ready.
