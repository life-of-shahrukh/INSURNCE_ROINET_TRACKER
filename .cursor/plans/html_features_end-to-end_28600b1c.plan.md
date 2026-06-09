---
name: HTML Features End-to-End
overview: All 7 HTML features (Dashboard, Leads, Deals, POSP, Renewals, Commissions, Reports) have page files in place. The only blocker is a data pipeline mismatch between backend and frontend, plus overly strict DTO validation that prevents saving deals.
todos:
  - id: fix-dto
    content: Make policyNo and issued optional in CreateDealDto (and confirm UpdateDealDto inherits it)
    status: pending
  - id: fix-http-crm-api
    content: Add RawDeal/RawPosp types and toDeal/toPosp deserializers in http-crm-api.ts; apply to getState, createDeal, updateDeal
    status: pending
  - id: verify-dashboard
    content: "Verify Dashboard: KPIs render, all 3 charts load, recent deals table shows data"
    status: pending
  - id: verify-deals
    content: "Verify Deals Tracker: table renders, filter chips work, edit/delete modal saves correctly"
    status: pending
  - id: verify-posp
    content: "Verify POSP Roster: cards show correct deal count and premium, add/edit modal works"
    status: pending
  - id: verify-renewals
    content: "Verify Renewals: renewal dates calculate correctly from issued Date objects"
    status: pending
  - id: verify-commissions
    content: "Verify Commissions: POSP totals row renders correctly"
    status: pending
  - id: verify-reports
    content: "Verify Reports: all 3 charts render, policy summary table populates, CSV export works"
    status: pending
  - id: typecheck
    content: Run tsc --noEmit and eslint on both app/ and server/ to confirm zero errors
    status: pending
isProject: false
---

# Implement All 7 HTML CRM Features End-to-End

## Root Cause Analysis

All 7 pages already exist. Two issues block them from working with live data:

### Issue 1 — Field name mismatch (affects Dashboard, Deals, POSP, Renewals, Commissions, Reports)
The backend Prisma `Deal` model stores customer name as `customerName` (Prisma field), but the frontend `Deal` interface expects `customer: string`. The `http-crm-api.ts` fetches raw JSON and passes it through without remapping.

### Issue 2 — Date deserialization missing (affects Renewals, Dashboard sort, all charts)
`GET /api/deals` and `GET /api/posp` return dates as ISO strings in JSON. The frontend `Deal` and `Posp` types declare `expected: Date`, `issued?: Date`, `joined: Date`, `createdAt: Date` — these must be `Date` objects for renewal calculations, chart rendering, and sort to work.

### Issue 3 — DTO validation too strict (blocks Deal create/update)
`CreateDealDto` has `@IsNotEmpty() policyNo` and `@IsDateString() issued` (required, non-optional). New deals always start with no policy number or issuance date, so the modal submit always returns `400 Bad Request`.

---

## Changes: 3 Files

### 1. [`server/src/modules/deal/dto/create-deal.dto.ts`](server/src/modules/deal/dto/create-deal.dto.ts)
Make `policyNo` and `issued` optional:
```ts
@IsOptional()
@IsString()
policyNo?: string;

@IsOptional()
@IsDateString()
issued?: string;
```

### 2. [`server/src/modules/deal/dto/update-deal.dto.ts`](server/src/modules/deal/dto/update-deal.dto.ts)
Confirm it is `PartialType(CreateDealDto)` — if not, apply the same optional decorators.

### 3. [`app/src/lib/api/http-crm-api.ts`](app/src/lib/api/http-crm-api.ts)
Add two deserializer helpers and use them in `getState`, `createDeal`, `updateDeal`:

```ts
// raw shapes coming from JSON
interface RawDeal { customerName: string; expected: string; issued?: string; createdAt: string; updatedAt: string; [k: string]: unknown }
interface RawPosp { joined: string; createdAt: string; updatedAt: string; [k: string]: unknown }

function toDeal(d: RawDeal): Deal {
  return { ...d, customer: d.customerName, expected: new Date(d.expected),
    issued: d.issued ? new Date(d.issued) : undefined,
    createdAt: new Date(d.createdAt), updatedAt: new Date(d.updatedAt) } as Deal;
}
function toPosp(p: RawPosp): Posp {
  return { ...p, joined: new Date(p.joined),
    createdAt: new Date(p.createdAt), updatedAt: new Date(p.updatedAt) } as Posp;
}
```

`getState` becomes:
```ts
getState: () =>
  Promise.all([
    request<RawPosp[]>("/api/posp"),
    request<RawDeal[]>("/api/deals"),
  ]).then(([rawPosp, rawDeals]) => ({
    posp: rawPosp.map(toPosp),
    deals: rawDeals.map(toDeal),
  })),
```

`createDeal` and `updateDeal` responses also go through `toDeal`.

---

## Feature Checklist (all unlock after the 3-file fix)

- **Dashboard** — KPIs (Total Premium, Retained Margin, Hot Deals, Active POSPs, Conversion %), 3 charts, Recent Deals table
- **Leads Pipeline** — Kanban by closure timeline (THIS_MONTH / T+1 / T+2 / LATER) — enhanced beyond HTML's H/W/C kanban
- **Deals Tracker** — Full table, H/W/C filter chips, search, edit/delete
- **POSP Roster** — Card grid with deal count, premium total, joined date; add/edit POSP modal
- **Renewals** — Policies due within 90 days auto-calculated from issuance date
- **Commissions** — COA and retained margin breakdown per POSP, with totals row
- **Reports** — Monthly trend chart, conversion funnel chart, product funnel chart, policy summary table, CSV export

Bonus pages already working (beyond HTML scope): **Customers** and **Sales Team**.
