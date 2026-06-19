# Roinet CRM — Role-Based Access Guide

## Role hierarchy

Higher roles inherit access from lower roles (`MinRole` checks use numeric rank).

```
SUPER_ADMIN (100)
  └── NATIONAL_HEAD (80)
        └── ZH — Zonal Head (60)
              └── RH — Regional Head (40)
                    └── ASM — Area Sales Manager (20)
                          └── DM — District Manager (10)
                                └── POSP — Point of Sales Person (5)
```

---

## Seed login credentials

| Role | Label | Email | Password |
|------|-------|-------|----------|
| SUPER_ADMIN | Super Admin | `superadmin@roinet.com` | `Admin@1234` |
| NATIONAL_HEAD | National Head | `national@roinet.com` | `National@123` |
| ZH | Zonal Head | `zonal@roinet.com` | `Zonal@1234` |
| RH | Regional Head | `regional@roinet.com` | `Regional@123` |
| ASM | Area Sales Manager | `asm@roinet.com` | `Asm@12345` |
| DM | District Manager | `dm@roinet.com` | `Dm@123456` |
| POSP | POSP Agent | `posp@roinet.com` | `Posp@1234` |

Public signup at `/signup` is **deprecated** — POSPs are synced from Cognitensor,
not registered in the CRM. See [POSP master data rule](../.cursor/rules/posp-master-data.mdc).

---

## Data visibility (backend scope)

Deals, leads, and POSP lists are filtered server-side by territory. Customers are **not** scoped yet (all authenticated roles see all customers).

| Role | Data territory |
|------|----------------|
| **SUPER_ADMIN** | All data nationwide |
| **NATIONAL_HEAD** | All data nationwide |
| **ZH** | Deals/leads/POSPs in their assigned **zone** |
| **RH** | Deals/leads/POSPs in their assigned **region** |
| **ASM** | Deals/leads/POSPs managed by their SalesTeam record (`asmId`) |
| **DM** | Deals/leads/POSPs in their assigned **area** (or under their ASM record) |
| **POSP** | **Own profile and own deals/leads only** (`pospId`) |

> Management roles (ZH–DM) need a linked **SalesTeam** record. Without one, scoped lists return empty.

---

## UI navigation (sidebar)

| Page | Min role | Notes |
|------|----------|-------|
| Dashboard | All | KPIs, charts, export (create deal — POSP only) |
| Renewals | All | Policies due in next 90 days |
| Leads Pipeline | DM | Blocked for POSP in UI |
| Deals Tracker | DM | Blocked for POSP in UI |
| Customers | DM | Blocked for POSP in UI |
| POSP Roster | DM | Blocked for POSP in UI |
| Sales Team | RH | List + manage team |
| Org Chart | RH | Hierarchy visualization |
| Commissions | ASM | COA & margin by POSP |
| Reports | ASM | Analytics + CSV export |

**POSP users** currently see only **Dashboard** and **Renewals** in the sidebar, even though the API supports more for their role.

---

## Filter dimensions (dashboard / list pages)

Geo and hierarchy filters start at each role's level — parent dimensions are hidden because the backend already scopes data there. List-page filters use the same rules via `UniversalFilter`.

| Role | Geo filters shown | Manager "By role" groups |
|------|-------------------|--------------------------|
| SUPER_ADMIN / NATIONAL_HEAD | Zone → Region → State → District → City → POSP | All subordinate org roles |
| ZH | Region → State → District → City → POSP | Below ZH (RH, ASM, DM, …) |
| RH | State → District → City → POSP | Below RH (ASM, DM, …) |
| ASM / DM | District → City → POSP | Below caller only |
| POSP | None | None |

| Filter | Visible to |
|--------|------------|
| Date range, deal status, product line, sub-type | All roles |
| Insurer, premium range, policy status, KYC, source | ASM and above |

---

## Feature matrix by role

Legend: ✅ Full access · 🔒 Scoped to territory · 👤 Own records only · ❌ No access

### Authentication

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| Login / logout | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View own session (`/auth/me`) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| POSP self-signup (`/signup`) | — | — | — | — | — | — | ✅ (public) |
| Approve / inactivate POSP accounts | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Dashboard & analytics

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| Dashboard KPIs & charts | 🔒→✅ all | 🔒→✅ all | 🔒 | 🔒 | 🔒 | 🔒 | 👤 |
| Export deals CSV | 🔒→✅ all | 🔒→✅ all | 🔒 | 🔒 | 🔒 | 🔒 | 👤 |
| Create deals | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Edit deals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 own |
| Delete deals | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Renewals page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commissions page | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reports & analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Leads pipeline

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List leads | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 (API) |
| Create leads | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 own |
| Monthly commitment view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 (API) |
| Convert lead → deal | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Leads page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Deals tracker

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List / export deals | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 (API) |
| Create deals | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Update deals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 own |
| Delete deals | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deals page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Customers

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List / search customers | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all |
| Create / update customers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customers page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### POSP roster

> **No manual POSP creation.** Roster rows sync from Cognitensor (`ListPospData`).
> Nobody adds POSPs in the CRM — list, export, and scoped view only.

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List POSPs | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 own profile |
| Add / register POSP | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Update POSP profile | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 own |
| POSP page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Sales team & org chart

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| View sales team list | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| View hierarchy / org chart | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create team member | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Update team member | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sync from external API | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Per-role summary

### SUPER_ADMIN
- Full system access; bypasses all explicit role checks.
- Sees **all** data with no territory filter.
- Can sync sales team from external API, manage org structure, delete deals.
- **Cannot create** new leads or deals — creation is POSP-only.

### NATIONAL_HEAD
- National-wide view — same data scope as Super Admin.
- Full access to sales team, org chart, reports, commissions, and all CRM modules in the UI.
- **Cannot create** new leads or deals — creation is POSP-only.

### ZH (Zonal Head)
- Sees deals, leads, and POSPs in their **zone**.
- Can filter by zone → region → area → district → POSP.
- Can create/update sales team members and trigger **external API sync**.
- Access to reports, commissions, and full CRM pages.

### RH (Regional Head)
- Sees data in their **region** and below.
- Manages sales team (create, update, view hierarchy & org chart).
- Cannot trigger external sales-team sync (ZH+ only).
- Access to reports, commissions, and full CRM pages.

### ASM (Area Sales Manager)
- Sees deals/leads/POSPs for POSPs they **manage** (`asmId` link).
- Can **delete deals** and **convert leads to deals**.
- Access to commissions and reports.
- Cannot access sales team or org chart pages (RH+ in UI).
- **Cannot add POSPs** — roster is Cognitensor-synced only.

### DM (District Manager)
- Sees deals/leads/POSPs in their **area** territory.
- Full CRM UI access (leads, deals, customers, POSP roster).
- Cannot delete deals, convert leads, or access sales team / reports / commissions.
- **Cannot add POSPs** — roster is Cognitensor-synced only.

### POSP (Point of Sales Person)
- **API:** own deals/leads, own POSP profile, customer CRUD (all customers — no scope yet).
- **UI:** Dashboard + Renewals only; other pages redirect to dashboard.
- **Only role that creates** new leads and deals (always tied to own `pospId`).
- Account is provisioned via Cognitensor sync or POSP SSO — **not** self-registration in CRM.

---

## API endpoint quick reference

| Endpoint | Allowed roles |
|----------|---------------|
| `POST /api/auth/login` | Public |
| `POST /api/auth/signup-posp` | Deprecated — do not use; POSPs sync from Cognitensor |
| `PATCH /api/auth/approve-posp/:id` | Deprecated with signup flow |
| `POST /api/deals` | **POSP only** (create) |
| `PATCH /api/deals/:id` | DM+ and POSP (scoped) |
| `DELETE /api/deals/:id` | ASM+ |
| `POST /api/leads` | **POSP only** (create) |
| `PATCH /api/leads/:id` | DM+ and POSP (scoped) |
| `POST /api/leads/:id/convert` | ASM+ |
| `GET/POST/PATCH /api/customers` | DM+ and POSP (no scope) |
| `GET /api/posp` | DM+ and POSP (scoped) |
| `POST /api/posp` | ASM+ |
| `PATCH /api/posp/:id` | ASM+ and POSP (own) |
| `GET /api/sales-team` | DM+ (management only) |
| `POST/PATCH /api/sales-team` | RH+ |
| `GET /api/sales-team/hierarchy`, `/org-chart` | RH+ |
| `POST /api/sales-team/sync` | ZH+ |

---

## Known gaps

1. **POSP UI vs API** — POSP can use deals/leads/customers via API but is blocked from those pages in the frontend (`minRole: "DM"`).
2. **Customer scoping** — All roles see all customers; territory filtering is not applied yet.
3. **Management users without SalesTeam record** — ZH/DM/ASM/RH users see empty scoped lists until linked in the sales team table.
