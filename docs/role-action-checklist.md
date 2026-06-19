# Roinet CRM — Role × Action Checklist (Product Sign-off)

> **Purpose of this document**
> A single master list of **every action** the system can perform, **independent of who can do it today**.
> The product team uses the checklist grid to confirm — for each role — whether that role *should* be able to perform the action.
>
> Example of how to read a row: `Add customer → DM+ ✅`, `Create deal → POSP ✅`.
> POSPs are **never** added in the CRM — roster syncs from Cognitensor only.
> **Only POSPs** create new leads and deals.

---

## 1. How to use this document

This document has three parts:

1. **Action Catalog** (Section 4) — every action, with its **business meaning** and its **technical detail** (API endpoint / UI surface). This is the "what does this action mean" reference.
2. **Role × Action Checklist Grid** (Section 5) — the tick sheet. One row per action, one column per role. Mark each cell.
3. **Working-flow walkthrough A→Z** (Section 6) — the same actions arranged in the order they happen in a real sales lifecycle, so nothing is missed.

### Marking convention

The checklist grid (Section 5) is **blank** — every role cell is an empty box `☐` for the team to fill in.

For each cell, write the level of access the role **should** have:

| Write | Meaning |
|:-----:|---------|
| ✅ | Allowed — **full access** (all data) |
| 🟡 | Allowed — **scoped** to the role's territory (zone/region/area/district) |
| 👤 | Allowed — **own records only** |
| ✗ | **Not** allowed |
| ❓ | Undecided / needs discussion |

**How to fill it:**
- Read the action's **Business purpose** and **Tech detail** in the Catalog (Section 4) first.
- Put a mark in every role cell for every action — don't leave gaps.
- The **Notes / Doubt** column already lists open questions I flagged; resolve them as you go.
- When the rule is agreed, tick **Business ✓** (business has decided) and **Tech ✓** (system matches / dev to enforce).

> A reference copy of the *current* as-built behaviour lives in `docs/role-access-guide.md` if you want to compare against what exists today — but this sheet is meant to be filled fresh.

---

## 2. Roles (top → bottom of hierarchy)

| Code | Role | Rank | Short description |
|------|------|:----:|-------------------|
| **SA** | SUPER_ADMIN | 100 | Full system access; bypasses all role checks; sees all data nationwide. |
| **NH** | NATIONAL_HEAD | 80 | National view, same data scope as SA, no system-config shortcuts. |
| **ZH** | ZH (Zonal Head) | 60 | Data within their **zone**. |
| **RH** | RH (Regional Head) | 40 | Data within their **region**. |
| **ASM** | ASM (Area Sales Manager) | 20 | Data for POSPs they manage (their area). |
| **DM** | DM (District Manager) | 10 | Data within their **district / area**. |
| **POSP** | POSP (Point of Sales Person) | 5 | Field agent — **own** profile, leads, and deals only. |

> "Min role" access is **inherited upward**: if a DM can do something, every role above DM can too (unless explicitly restricted).

---

## 3. Two-perspective checklist (Business side vs Tech side)

For every action below, sign-off should be confirmed from **both** angles:

- **Business side** — *Should this role be allowed to do this, given how the company operates?* (commercial / compliance / process ownership)
- **Tech side** — *Is the rule actually enforced in the code/API, and is the data correctly scoped?* (endpoint guard, territory filter, field-level masking)

A row is "done" only when **business** has decided the rule **and** tech has confirmed the system matches it. Use the two columns at the end of Section 5.

---

## 4. Action Catalog (business + technical meaning)

> Total actions: **52**, grouped into 9 functional areas.
> "Current default" = the access rule as built today.

### A. Authentication & Account

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| A1 | Login | Sign in to the CRM | `POST /api/auth/login` (sets HttpOnly JWT cookie) | Public (all) |
| A2 | Logout | End session | `POST /api/auth/logout` | Public (all) |
| A3 | View own session | Read who am I / role / status | `GET /api/auth/me` | All authenticated |
| A4 | POSP self-signup | ~~New agent registers themselves~~ | `POST /api/auth/signup-posp` — **deprecated**; POSPs sync from Cognitensor | ❌ none |
| A5 | Approve POSP account | ~~Activate a pending signup~~ | `PATCH /api/auth/approve-posp/:id` — **deprecated** | ❌ none |
| A6 | Inactivate / reactivate POSP account | ~~Suspend or restore an agent~~ | `PATCH /api/auth/approve-posp/:id` — **deprecated** | ❌ none |
| A7 | View own profile | See own personal details | `GET /api/profile` + `/profile` page | All authenticated |

### B. Dashboard & Analytics

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| B1 | View dashboard KPIs & charts | Headline numbers & trends | `GET /api/dashboard/stats` + `/dashboard` | All (scoped) |
| B2 | View financial metrics (COA, margin, cost-per-issued policy) | Profitability figures | `dashboard/stats` (financial fields stripped for non-SA) | **SA only** |
| B3 | Apply geo / hierarchy filters | Filter options match the role's data scope (geo starts at role level; role groups exclude seniors). | `GET /api/hierarchy/filter-options`, `GET /api/geo/catalog` | All (scoped options) |
| B4 | Drill-down scope bar (subordinates) | Cascade into a manager's team | `GET /api/hierarchy/subordinates` | DM+ |
| B5 | Reports & analytics page | Deeper analytics + CSV | `/reports` page | ASM+ (UI) |
| B6 | Commissions page | COA & margin per POSP | `/commissions` page | ASM+ (UI) |
| B7 | Renewals page | Policies due in next 90 days | `/renewals` page | All |

### C. Leads Pipeline

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| C1 | List leads | View pipeline | `GET /api/leads` | DM+ & POSP (scoped) |
| C2 | Create lead | Log a new prospect | `POST /api/leads` | **POSP only** |
| C3 | Update lead | Edit a prospect | `PATCH /api/leads/:id` | DM+ & POSP |
| C4 | Export leads CSV | Download pipeline | `GET /api/leads/export` | DM+ & POSP (scoped) |
| C5 | View monthly commitment | Lead targets per month | `GET /api/leads/commitment` | DM+ & POSP |
| C6 | Convert lead → deal | Promote a lead to a working deal | `POST /api/leads/:id/convert` | ASM+ |
| C7 | Access Leads page (UI) | Open the Leads Pipeline screen | `/leads` page | DM+ (POSP blocked in UI) |

### D. Deals / Quotes Tracker

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| D1 | List deals | View all working deals/quotes | `GET /api/deals` | DM+ & POSP (scoped) |
| D2 | Create deal / quote | Add a new quote/deal | `POST /api/deals` | **POSP only** |
| D3 | Update deal | Edit deal (status H/W/C, premium, etc.) | `PATCH /api/deals/:id` | DM+, ASM+ & POSP |
| D4 | Delete deal | Remove a deal | `DELETE /api/deals/:id` | ASM+ |
| D5 | Export deals CSV | Download deals | `GET /api/deals/export` | DM+ & POSP (scoped) |
| D6 | Assign deal to **any** POSP | ~~Create on behalf of any agent~~ | UI deal modal POSP picker on create | **Not in product** — POSP-only create |
| D7 | Access Deals page (UI) | Open the Deals Tracker screen | `/deals` page | DM+ (POSP blocked in UI) |

### E. Customers

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| E1 | List customers | View customer book | `GET /api/customers` | DM+ & POSP (no scope) |
| E2 | Search customers | Find a customer | `GET /api/customers/search` | DM+ & POSP |
| E3 | Create customer | Add a new customer | `POST /api/customers` | DM+ & POSP |
| E4 | Update customer | Edit customer details | `PATCH /api/customers/:id` | DM+ & POSP |
| E5 | Export customers CSV | Download customer list | `GET /api/customers/export` | DM+ & POSP |
| E6 | Access Customers page (UI) | Open the Customers screen | `/customers` page | DM+ (POSP blocked in UI) |

### F. POSP Roster

> **No manual POSP creation.** Roster is Cognitensor-synced only (`npm run seed:all`).

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| F1 | List POSPs | View agent roster | `GET /api/posp` | DM+ (scoped) & POSP (own) |
| F2 | Register new POSP | ~~Onboard an agent~~ | `POST /api/posp` — **deprecated**; not in product | ❌ none |
| F3 | Update POSP profile | Edit an agent's record | `PATCH /api/posp/:id` | ASM+ & POSP (own) |
| F4 | Export POSP CSV | Download roster | `GET /api/posp/export` | DM+ (scoped) |
| F5 | "Add POSP" button (UI) | ~~Onboarding shortcut~~ | `/posp` page — **not in product** | ❌ none |
| F6 | Access POSP page (UI) | Open the POSP Roster screen | `/posp` page | DM+ (POSP blocked in UI) |

### G. Sales Team & Org Chart

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| G1 | View sales team list | See the management team | `GET /api/sales-team` | DM+ (management only) |
| G2 | Create team member | Add a manager (DM/ASM/RH…) | `POST /api/sales-team` | RH+ |
| G3 | Update team member | Edit a manager record | `PATCH /api/sales-team/:id` | RH+ |
| G4 | View hierarchy | Reporting tree | `GET /api/sales-team/hierarchy` | RH+ |
| G5 | View org chart | Org-chart visualization | `GET /api/sales-team/org-chart` + `/org-chart` page | RH+ |
| G6 | Export sales team CSV | Download team list | `GET /api/sales-team/export` | DM+ |
| G7 | Sync sales team from external API | Pull org structure from Cognitensor | `POST /api/sales-team/sync` | ZH+ |

### H. External / Master Data (Cognitensor)

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| H1 | List states | Geo dropdown source | `GET /api/external/states` | All |
| H2 | List districts | Geo dropdown source | `GET /api/external/districts` | All |
| H3 | List cities | Geo dropdown source | `GET /api/external/cities` | All |
| H4 | List external hierarchy | District→DM→ASM→ZH→NH tree | `GET /api/external/hierarchy` | RH+ |
| H5 | List external POSPs | Paginated external POSP list | `GET /api/external/posps` | ASM+ |

### I. (Reserved for new actions)

| # | Action | Business purpose | Tech detail (endpoint / surface) | Current default |
|:-:|--------|------------------|----------------------------------|-----------------|
| I1 | _Add new action here_ | | | _not built_ |
| I2 | _Add new action here_ | | | _not built_ |

---

## 5. Role × Action Checklist Grid (the tick sheet)

> **Blank — to be filled by the team.** In each role cell write: ✅ full · 🟡 scoped · 👤 own only · ✗ none · ❓ undecided.
> `Business ✓` = business has decided the rule. `Tech ✓` = system enforces it (dev confirms).
> The **Notes / Doubt** column flags my open questions — please resolve them.

### A. Authentication & Account

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| A1 | Login | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| A2 | Logout | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| A3 | View own session | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| A4 | POSP self-signup | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** not in product — Cognitensor sync only. |
| A5 | Approve POSP account | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** deprecated with signup. |
| A6 | Inactivate / reactivate POSP | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** deprecated with signup. |
| A7 | View own profile | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

### B. Dashboard & Analytics

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| B1 | Dashboard KPIs & charts | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Confirm each role's scope (full vs territory vs own). |
| B2 | Financial metrics (COA / margin) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Currently SA-only. Should NH / ZH see profitability? |
| B3 | Apply geo / hierarchy filters | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Filter options should match the role's data scope. |
| B4 | Drill-down scope bar | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should POSP have any drill-down, or none (no subordinates)? |
| B5 | Reports & analytics page | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should DM get reports, or stay ASM+? |
| B6 | Commissions page | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should a POSP see their **own** commission/earnings? |
| B7 | Renewals page | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Confirm renewals scope per role. |

### C. Leads Pipeline

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| C1 | List leads | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| C2 | Create lead | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** POSP only. |
| C3 | Update lead | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Can a manager edit a lead they don't own, or only reassign it? |
| C4 | Export leads CSV | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should POSP be able to export data at all? |
| C5 | Monthly commitment view | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| C6 | Convert lead → deal | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Currently ASM+. Should DM or POSP convert their own leads? |
| C7 | Access Leads page (UI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ POSP is API-allowed but UI-blocked — intended? |

### D. Deals / Quotes Tracker

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| D1 | List deals | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| D2 | Create deal / quote | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** POSP only. |
| D3 | Update deal | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Can status be moved freely (H→W→C) by all, or only certain roles can mark "C" (closed/issued)? |
| D4 | Delete deal | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Hard delete vs soft delete? Who, and is a reason required? |
| D5 | Export deals CSV | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should POSP export deals? |
| D6 | Assign deal to **any** POSP | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** no manager create — POSP-only. |
| D7 | Access Deals page (UI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ POSP is API-allowed but UI-blocked — intended? |

### E. Customers

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| E1 | List customers | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Customers are **not** territory-scoped today — every role sees all. Should they be scoped? |
| E2 | Search customers | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Same scoping question as E1. |
| E3 | Create customer | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| E4 | Update customer | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Can anyone edit any customer, or only the owner/manager? |
| E5 | Export customers CSV | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ PII export — who is allowed? Should POSP be excluded? |
| E6 | Access Customers page (UI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ POSP is API-allowed but UI-blocked — intended? |

### F. POSP Roster

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| F1 | List POSPs | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| F2 | Register new POSP | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** not in product — Cognitensor sync only. |
| F3 | Update POSP profile | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Which POSP fields can a POSP edit on their own profile vs manager-only fields? |
| F4 | Export POSP CSV | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| F5 | "Add POSP" button (UI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | **Resolved:** not in product. |
| F6 | Access POSP page (UI) | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |

> **POSP onboarding:** agents are provisioned in Cognitensor, then appear via `seed:all` / snapshot refresh. No CRM registration flow.

### G. Sales Team & Org Chart

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| G1 | View sales team list | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| G2 | Create team member | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should this be limited if team is auto-synced from Cognitensor (G7)? Could cause duplicates. |
| G3 | Update team member | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Same sync concern as G2. |
| G4 | View hierarchy | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should ASM/DM see the hierarchy below them? Currently RH+ only. |
| G5 | View org chart | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Same as G4. |
| G6 | Export sales team CSV | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | |
| G7 | Sync from external API | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Currently ZH+. Is this an admin/ops action that should be SA/NH only? |

### H. External / Master Data (Cognitensor)

| # | Action | SA | NH | ZH | RH | ASM | DM | POSP | Business ✓ | Tech ✓ | Notes / Doubt |
|:-:|--------|:--:|:--:|:--:|:--:|:---:|:--:|:----:|:----------:|:------:|---------------|
| H1 | List states | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Geo dropdown — usually open to all. |
| H2 | List districts | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Geo dropdown — usually open to all. |
| H3 | List cities | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | Geo dropdown — usually open to all. |
| H4 | List external hierarchy | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Exposes the full org tree — confirm RH+ floor. |
| H5 | List external POSPs | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ | ❓ Should this be scoped to the caller's territory, not all-India? |

---

## 6. Working-flow walkthrough (A → Z)

The same actions, ordered the way a real sales lifecycle runs. Use this to confirm **nothing in the journey is missing a role rule**.

```
STEP 0 — Setup / Onboarding
  0.1  Org structure synced from Cognitensor ............ G7, H4
  0.2  Sales-team managers created (DM/ASM/RH/ZH/NH) .... G2, G3
  0.3  POSP provisioned in Cognitensor + seed:all .... (no CRM signup)
  0.4  ~~Manager approves POSP~~ .................... deprecated
  0.5  POSP profile maintained ......................... F3, F1

STEP 1 — Login & context
  1.1  User logs in ................................... A1
  1.2  Session & profile loaded ...................... A3, A7
  1.3  Dashboard + scope filters loaded .............. B1, B3, B4

STEP 2 — Lead capture
  2.1  Customer record created / found ................ E1, E2, E3
  2.2  Lead created against customer ................. C2
  2.3  Lead worked / updated ......................... C3
  2.4  Monthly commitment tracked .................... C5

STEP 3 — Quote / Deal
  3.1  Lead converted to deal (ASM sign-off) ......... C6
  3.2  Deal / quote created by POSP ................ D2
  3.3  Deal status progressed H → W → C ............. D3
  3.4  Bad deal removed .............................. D4

STEP 4 — Policy & Renewal
  4.1  Issued policy tracked on deal ................. D1, D3
  4.2  Renewals due in 90 days monitored ............. B7

STEP 5 — Reporting & Oversight
  5.1  Lists exported (leads/deals/customers/POSP) ... C4, D5, E5, F4, G6
  5.2  Reports & commissions reviewed ................ B5, B6
  5.3  Financial profitability (COA/margin) — SA ..... B2
  5.4  Org chart / hierarchy reviewed ................ G4, G5
```

**Lifecycle coverage check:** every action A1–H5 appears at least once above. If the business adds a new step (e.g. payment collection, claims, document upload), add it to Section 4 (area I) and to this flow.

---

## 7. Open questions for product (please decide)

1. **POSP UI access** — POSP can use leads/deals/customers via API but is blocked from those pages in the app. Should POSP get those screens, or should the API be locked to match the UI? (C7, D7, E6, F6)
2. **Customer scoping** — All roles currently see all customers (no territory filter). Should customers be scoped like deals/leads? (E1–E5)
3. **Add POSP** — **Resolved:** not in product. POSPs sync from Cognitensor only. (F2, F5)
4. **Financial visibility** — COA/margin is SUPER_ADMIN only. Should NH or ZH also see profitability? (B2)
5. **Deal assignment on create** — **Resolved:** POSP-only create; no manager assignment. (D6)
6. **Delete permissions** — Only deals can be deleted (ASM+). Should leads / customers / POSPs ever be deletable, and by whom?
7. **POSP onboarding** — **Resolved:** Cognitensor + `seed:all`; no CRM self-signup. (A4)
8. **External POSP list scope** — `GET /api/external/posps` returns all-India data; should it be scoped to the caller's territory? (H5)
9. **Sync vs manual team edits** — Sales team is both auto-synced from Cognitensor (G7) and manually editable (G2/G3). Confirm which is the source of truth to avoid duplicates.
10. **Status transition rights** — Should every editor be able to mark a deal Closed/Issued (status `C`), or only specific roles? (D3)
11. **PII / data export** — Who may export customer PII and POSP data, and should POSP be excluded from all exports? (E5, C4, D5)
12. **Edit-not-own** — Can a manager edit a lead/customer/deal they don't own, or only view/reassign it? (C3, D3, E4)
13. **Missing actions?** — Are there business actions not yet in the system (payments, claims, document upload, audit log, bulk import)? Add them in Section 4, area **I**.

---

_Generated from the codebase: NestJS controllers (`server/src/modules/**`), role constants (`server/src/common/constants.ts`), the frontend sidebar (`app/src/components/layout/Sidebar.tsx`), and `docs/role-access-guide.md`. The checklist grid (Section 5) is intentionally **blank** for the team to fill; the "Current default" column in Section 4 is only a reference to what exists today._
