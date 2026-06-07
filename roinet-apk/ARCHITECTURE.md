# Mobile Architecture — Roinet CRM (Expo)

Feature-based React Native app aligned with the Next.js frontend (`app/`) and NestJS backend (`server/`).

## Monorepo layout

```
INSURNCE_ROINET_TRACKER/
├── app/          # Next.js web CRM
├── roinet-apk/   # Expo mobile CRM (this document)
└── server/       # NestJS + Prisma API
```

## Folder structure

```
roinet-apk/src/
├── app/                    # Expo Router — thin route files only
│   ├── (crm)/              # Authenticated tab navigator
│   │   ├── dashboard.tsx
│   │   ├── deals.tsx
│   │   ├── renewals.tsx
│   │   └── more/           # Admin stack (POSP, commissions, reports)
│   ├── login.tsx
│   └── signup.tsx
├── core/
│   ├── constants/
│   └── providers/          # AuthProvider, CrmProvider
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── deals/
│   ├── posp/
│   └── renewals/
├── shared/
│   ├── components/         # Button, Card, Badge, KpiCard…
│   ├── data/seed.ts
│   ├── services/api-client.ts
│   ├── types/
│   └── utils/
└── theme/                  # colors, spacing, typography (matches web CSS vars)
```

## Design parity with web

| Web (`globals.css`) | Mobile (`theme/colors.ts`) |
|---------------------|----------------------------|
| `--primary` #0f4c75 | `Colors.primary` |
| `--bg` #f4f6fa | `Colors.bg` |
| KPI cards, badges | `KpiCard`, `Badge` components |
| Sidebar nav | Bottom tabs + More stack |

## Role-based navigation

| Role  | Tabs visible |
|-------|--------------|
| Admin | Dashboard, Deals, Renewals, More |
| POSP  | Dashboard, Renewals |

Matches `Sidebar.tsx` POSP_NAV filter in the web app.

## API layer

- `shared/services/api-client.ts` — base fetch + JWT from AsyncStorage
- `features/deals/services/` — CRM endpoints (http + mock)
- `features/auth/services/` — login/signup (http + mock)

Set `EXPO_PUBLIC_USE_MOCK=true` in `.env` for offline demo with seeded data.

## Environment

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_USE_MOCK=true
```

Android emulator: use `http://10.0.2.2:8000` instead of localhost.

## Dev commands

```bash
cd roinet-apk
npm start          # Expo dev server
npm run android    # Android
npm run ios        # iOS
```

Mock login: `admin@roinet.com` / `Admin@1234`
