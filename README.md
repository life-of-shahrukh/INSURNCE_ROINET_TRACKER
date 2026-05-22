# RoiNet CRM — Insurance Tracker

A full-stack monorepo CRM for RoiNet Insurance tracking.

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
