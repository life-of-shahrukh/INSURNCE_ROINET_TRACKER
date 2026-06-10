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

Public signup is also available at `/signup` (creates a **POSP** user in `PENDING` status until approved).

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
| Dashboard | All | KPIs, charts, create deal, export |
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

| Filter | Visible to |
|--------|------------|
| Date range, deal status, product line, sub-type | All roles |
| Zone | SUPER_ADMIN, NATIONAL_HEAD |
| Region | SUPER_ADMIN, NATIONAL_HEAD, ZH |
| Area | SUPER_ADMIN, NATIONAL_HEAD, ZH, RH |
| District | SUPER_ADMIN, NATIONAL_HEAD, ZH, RH, ASM |
| POSP picker | SUPER_ADMIN, NATIONAL_HEAD, ZH, RH, ASM, DM |
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
| Create / edit deals (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 (dashboard modal) |
| Assign deal to any POSP | ✅ only | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Delete deals | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Renewals page | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Commissions page | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Reports & analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |

### Leads pipeline

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List leads | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 (API) |
| Create / update leads | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 (API) |
| Monthly commitment view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 (API) |
| Convert lead → deal | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Leads page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Deals tracker

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List / export deals | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 (API) |
| Create / update deals | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 👤 |
| Delete deals | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Deals page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### Customers

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List / search customers | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all | ✅ all |
| Create / update customers | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Customers page (UI) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

### POSP roster

| Feature | SUPER_ADMIN | NATIONAL_HEAD | ZH | RH | ASM | DM | POSP |
|---------|:-----------:|:-------------:|:--:|:--:|:---:|:--:|:----:|
| List POSPs | 🔒→✅ | 🔒→✅ | 🔒 | 🔒 | 🔒 | 🔒 | 👤 own profile |
| Register new POSP (API) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Add POSP button (UI) | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
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
- Only role that can **pick any POSP** when creating a deal in the UI.
- Can sync sales team from external API, manage org structure, approve POSPs, delete deals.

### NATIONAL_HEAD
- National-wide view — same data scope as Super Admin.
- Cannot use Super-Admin-only UI shortcuts (e.g. POSP picker on deals is Super Admin only).
- Full access to sales team, org chart, reports, commissions, and all CRM modules in the UI.

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
- Can **register POSPs**, **approve pending POSP signups**, **delete deals**, and **convert leads to deals**.
- Access to commissions and reports.
- Cannot access sales team or org chart pages (RH+ in UI).

### DM (District Manager)
- Sees deals/leads/POSPs in their **area** territory.
- Full CRM UI access (leads, deals, customers, POSP roster).
- Can add POSPs via UI button (with Super Admin and ASM).
- Cannot delete deals, convert leads, approve POSP accounts, or access sales team / reports / commissions.

### POSP (Point of Sales Person)
- **API:** own deals/leads, own POSP profile, customer CRUD (all customers — no scope yet).
- **UI:** Dashboard + Renewals only; other pages redirect to dashboard.
- Creates deals for **self only** (server enforces `pospId`).
- Can self-register via `/signup` (starts as `PENDING` until ASM+ approves).

---

## API endpoint quick reference

| Endpoint | Allowed roles |
|----------|---------------|
| `POST /api/auth/login` | Public |
| `POST /api/auth/signup-posp` | Public |
| `PATCH /api/auth/approve-posp/:id` | ASM+ |
| `GET/POST/PATCH /api/deals` | DM+ and POSP (scoped) |
| `DELETE /api/deals/:id` | ASM+ |
| `GET/POST/PATCH /api/leads` | DM+ and POSP (scoped) |
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
