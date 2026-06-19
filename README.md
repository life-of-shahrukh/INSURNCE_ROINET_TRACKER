# RoiNet CRM — Insurance Tracker

A full-stack monorepo CRM for RoiNet Insurance tracking.

## Key product rules

- **POSPs are never added in the CRM.** The POSP roster is read-only master
  data synced from Cognitensor (`ListPospData` → `npm run seed:all`). Managers,
  admins, and agents do not register new POSPs via the UI or API. See
  [`.cursor/rules/posp-master-data.mdc`](.cursor/rules/posp-master-data.mdc).
- **Only POSPs create new leads and deals.** Managers may view, update, export,
  and convert leads — but `POST /api/leads` and `POST /api/deals` are POSP-only.
  See [`.cursor/rules/crm-pipeline-creation.mdc`](.cursor/rules/crm-pipeline-creation.mdc).

## Structure

```
roinet-crm/
├── app/        # Next.js frontend
└── server/     # NestJS backend with Prisma
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL

### Install dependencies

```bash
# Frontend
cd app && npm install

# Backend
cd server && npm install
```

### Environment setup

- `app/.env.local` — copy from `app/.env.example`
- `server/.env` — copy from `server/.env.example`

### Run in development

```bash
# Frontend (http://localhost:3000)
cd app && npm run dev

# Backend (http://localhost:3001)
cd server && npm run start:dev
```
