# Roinet CRM — API Endpoints

Base URL (local): `http://localhost:8000`  
API prefix: `/api`  
Swagger UI: `http://localhost:8000/api/docs`  
Health (no auth): `GET /health`

Sample responses live in [`../responses/`](../responses/). Re-capture anytime:

```bash
node scripts/capture-app-api-responses.mjs
```

Default login used for capture: `superadmin@roinet.com` / `Admin@1234`

---

## Auth (`/api/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | Public | Email/password login; sets `access_token` HttpOnly cookie |
| POST | `/api/auth/logout` | Cookie | Clears session cookie |
| POST | `/api/auth/signup-posp` | Public | POSP self-registration |
| PATCH | `/api/auth/approve-posp/:userId` | Admin | Approve pending POSP user |
| GET | `/api/auth/me` | Cookie | Current user profile |

**Sample response:** [`../responses/auth-me.json`](../responses/auth-me.json)

---

## SSO (`/api/v1/sso`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/sso/get-redirect-uri` | `X-Sso-Api-Key` header | SSO server: get redirect URI for userCode |
| POST | `/api/v1/sso/verify-token` | Public | Frontend callback: verify RSA token, set cookie |

---

## Profile (`/api/profile`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profile` | Cookie | Logged-in user profile details |

---

## Dashboard (`/api/dashboard`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/dashboard/stats` | Cookie + scope | Aggregated deals/leads/posps/customers stats |

Query params: `subordinateLevel`, `subordinateCode`, `pospId`, `stateId`, `districtId`, `cityId`, date range filters.

**Sample response:** [`../responses/dashboard-stats.json`](../responses/dashboard-stats.json)

---

## Hierarchy — org graph (`/api/hierarchy`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/hierarchy/filter-options` | Cookie + scope | Caller role + subordinate/role-group dropdown options (geo now served by `/api/geo/*`) |
| GET | `/api/hierarchy/members/search` | Cookie + scope | Scoped member/user typeahead: `?q=&limit=&role=` |
| GET | `/api/hierarchy/subordinates` | Cookie + scope | Drill-down: `?level=…&code=…` |
| GET | `/api/hierarchy/org-chart` | Cookie + scope | Flat org chart nodes from OrgMember/OrgEdge |

**Sample responses:**
- [`../responses/hierarchy-filter-options.json`](../responses/hierarchy-filter-options.json)
- [`../responses/hierarchy-members-search.json`](../responses/hierarchy-members-search.json)
- [`../responses/hierarchy-org-chart.json`](../responses/hierarchy-org-chart.json)
- [`../responses/hierarchy-subordinates-drill.json`](../responses/hierarchy-subordinates-drill.json)

---

## Geo catalog + search (`/api/geo`)

Single cached source of geographic reference data. Small lists are served whole;
big lists (districts ~726, cities ~5.7k) are searched server-side so the client
never bulk-loads them. Used by every geo filter (dashboard scope bar + list pages).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/geo/catalog` | Cookie | Small reference lists: `{ zones, regions, states }` |
| GET | `/api/geo/districts/search` | Cookie | District typeahead: `?q=&limit=&stateId=&zoneId=&regionId=` |
| GET | `/api/geo/cities/search` | Cookie | City typeahead: `?q=&limit=&districtId=&stateId=` |
| GET | `/api/geo/districts/by-ids` | Cookie | Resolve district ids → labels: `?ids=a,b,c` |
| GET | `/api/geo/cities/by-ids` | Cookie | Resolve city ids → labels: `?ids=a,b,c` |

Geo filtering across deals/leads/posps/customers resolves any
zone/region/state/district/city selection to a set of Cognitensor `districtId`s
(union within a dimension, intersect across dimensions), then filters each
entity's `districtId`. Selecting an out-of-scope geo simply returns no rows.

**Sample responses:** [`../responses/geo-catalog.json`](../responses/geo-catalog.json), [`../responses/geo-districts-search.json`](../responses/geo-districts-search.json), [`../responses/geo-cities-search.json`](../responses/geo-cities-search.json)

---

## Org sync (`/api/org-sync`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/org-sync/rebuild` | ZH+ | Rebuild OrgMember/OrgEdge/OrgClosure/DistrictChain from Cognitensor |

---

## External Cognitensor proxy (`/api/external`)

Snapshot mode by default (`USE_EXTERNAL_API_SNAPSHOT=true`).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/external/states` | Cookie | List states |
| GET | `/api/external/districts` | Cookie | `?stateId=` filter. Each district now also carries `zoneid`/`zonename`/`regionid`/`regionname` |
| GET | `/api/external/cities` | Cookie | `?districtId=` filter |
| GET | `/api/external/zones` | Cookie | ListZone — all zones (`Zoneid`/`ZoneName`) |
| GET | `/api/external/hierarchy` | Cookie | ListHierarchyUserData snapshot/live |
| GET | `/api/external/posps` | Cookie | ListPospData with pagination/filters |

The expanded `ListDistrict` response shape (zone/region now included):

```json
{
  "StateId": "12",
  "DistrictId": "95",
  "DistrictName": "PATNA",
  "regionid": "2",
  "regionname": "Bihar",
  "zoneid": "6",
  "zonename": "Bihar/JHND"
}
```

**Sample responses:** [`../responses/external-states.json`](../responses/external-states.json), etc.

---

## POSP (`/api/posp`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/posp` | Cookie + scope | Paginated POSP list |
| GET | `/api/posp/export` | Cookie + scope | CSV export |
| POST | `/api/posp` | Manager | Create POSP |
| PATCH | `/api/posp/:id` | Cookie + scope | Update POSP |

---

## Deals (`/api/deals`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/deals` | Cookie + scope | Paginated deals |
| GET | `/api/deals/export` | Cookie + scope | CSV export |
| POST | `/api/deals` | Cookie + scope | Create deal |
| PATCH | `/api/deals/:id` | Cookie + scope | Update deal |
| DELETE | `/api/deals/:id` | Cookie + scope | Delete deal |

---

## Leads (`/api/leads`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/leads` | Cookie + scope | Create lead |
| GET | `/api/leads` | Cookie + scope | Paginated leads |
| GET | `/api/leads/export` | Cookie + scope | CSV export |
| GET | `/api/leads/commitment` | Cookie + scope | Commitment summary |
| PATCH | `/api/leads/:id` | Cookie + scope | Update lead |
| POST | `/api/leads/:id/convert` | Cookie + scope | Convert lead to deal |

---

## Customers (`/api/customers`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/customers` | Cookie + scope | Create customer |
| GET | `/api/customers` | Cookie + scope | Paginated list |
| GET | `/api/customers/export` | Cookie + scope | CSV export |
| GET | `/api/customers/search` | Cookie + scope | `?q=` search |
| PATCH | `/api/customers/:id` | Cookie + scope | Update customer |

---

## Sales team (`/api/sales-team`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/sales-team` | RH+ | Create team member |
| GET | `/api/sales-team` | Manager | Paginated list |
| GET | `/api/sales-team/export` | DM+ | CSV export |
| GET | `/api/sales-team/hierarchy` | RH+ | Internal SalesTeam tree |
| GET | `/api/sales-team/org-chart` | RH+ | Live Cognitensor org chart nodes |
| PATCH | `/api/sales-team/:id` | RH+ | Update member |
| POST | `/api/sales-team/sync` | ZH+ | Sync from external API + rebuild org graph |

---

## Misc

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | Public | ECS/ALB health check |
| GET | `/api` | Public | App hello string |

---

## Auth notes

- Session is an HttpOnly `access_token` cookie (JWT, 8h).
- Most routes use `JwtAuthGuard` + `RolesGuard` + hierarchy scope interceptor.
- POSP users see only their own data; managers see districts from `DistrictChain`.
