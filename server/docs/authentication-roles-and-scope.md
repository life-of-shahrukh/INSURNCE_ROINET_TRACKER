# Authentication, Roles & Data Scope

**Status**: ✅ Current
**Last Updated**: June 21, 2026

This document describes the RoiNet Tracker authentication flows, the role
hierarchy, and how each authenticated user's **data scope** (the territory of
records they are allowed to see) is resolved.

> **Identity key:** Cognitensor `UserCode` (for example `HARI.DUTT`) is the real
> business identity. Manager login emails are synthesized from `UserCode`; scope,
> org chart, and role labels resolve through `SalesTeam.employeeCode` →
> `OrgMember.userCode`. See
> [UserCode Identity & Login Mapping](./usercode-identity-and-login.md).

All backend routes are served under the global `/api` prefix (e.g.
`POST /api/auth/login`).

---

## 1. Roles

Roles are string constants (no Prisma enums, for MS SQL compatibility) defined
in `server/src/common/constants.ts`. They form a single privilege ladder —
higher rank can access anything a lower rank can.

| Role | Rank | Tier | Meaning | Data scope |
|------|------|------|---------|------------|
| `SUPER_ADMIN` | 100 | System | Full system access + configuration | **All data** (unrestricted) |
| `NATIONAL_HEAD` | 80 | R4 | National view, no system config | **All data** (unrestricted) |
| `ZH` | 60 | R3 | Zonal Head | Districts covered by their org node |
| `RH` | 40 | R2 | Regional Head | Districts covered by their org node |
| `ASM` | 20 | R1 | Area Sales Manager | Districts covered by their org node |
| `DM` | 10 | — | District Manager | Districts covered by their org node |
| `POSP` | 5 | — | Point of Sales Person (field agent) | Only their own POSP records |

- `Role` and `ROLE_RANK` live in `common/constants.ts`.
- Route protection uses `@MinRole(Role.X)` / `@Roles(...)` with `RolesGuard`,
  and `@Public()` to opt a route out of auth. See
  [RBAC Decorators Guide](./RBAC_DECORATORS.md).

---

## 2. Login flows

There are two ways to obtain a session, both of which end the same way: an
**HttpOnly `access_token` cookie** containing a signed JWT (`sub`, `email`,
`role`, `status`, optional `pospId`), valid for **8 hours**, `sameSite=lax`,
`secure` in production.

### 2.1 Password login (managers + admins + self-signed POSPs)

```
POST /api/auth/login
{ "email": "...", "password": "..." }
```

Flow (`auth.service.ts → login`):
1. Look up `User` by email.
2. `bcrypt.compare` the password against `passwordHash`.
3. Reject if the account status is not `ACTIVE`.
4. Sign the JWT, set the `access_token` cookie, return the user payload.

Related endpoints:
- `POST /api/auth/logout` — clears the cookie.
- `GET /api/auth/me` — returns the current session user (reads cookie).
- `POST /api/auth/signup-posp` — **deprecated.** POSPs sync from Cognitensor;
  do not use for new agents.
- `PATCH /api/auth/approve-posp/:userId` — **deprecated** with self-signup flow.

### 2.2 SSO login (Cognitensor → frontend)

Controller: `v1/sso` → `POST /api/v1/sso/...`. Uses an RSA-signed, short-lived
(≈300s) bounce token. Two endpoints:

1. **`POST /api/v1/sso/get-redirect-uri`** — called server-to-server by the
   central Roinet SSO server. Protected by the shared `x-sso-api-key` header.
   Accepts `{ userCode, isPosp }`, signs an `RS256` token containing the
   `userCode`, and returns a `redirectUri` of the form:
   ```
   {SSO_REDIRECT_BASE_URL}/sso/callback?token=<signed>&isPosp=<bool>
   ```
   `isPosp` is a **plain query param**, not part of the signed token.

2. **`POST /api/v1/sso/verify-token`** — called by the frontend `/sso/callback`
   page. Verifies the RSA signature + expiry, then:
   - `isPosp = true` → fetches fresh POSP data from Cognitensor
     (`getPospByUserCode`), upserts it locally, finds the linked CRM user by
     POSP code, and issues the same `access_token` cookie.
   - `isPosp = false` → **hierarchical manager SSO is not yet implemented**
     (throws `NotImplementedException`). Managers currently log in via password.
     When implemented, the SSO token's `userCode` will resolve to the same
     `User` / `SalesTeam` / scope as password login — see
     [UserCode Identity & Login Mapping](./usercode-identity-and-login.md).

> Required env: `SSO_API_KEY`, `SSO_RSA_PRIVATE_KEY`, `SSO_RSA_PUBLIC_KEY`,
> `SSO_REDIRECT_BASE_URL`, `SSO_TOKEN_EXPIRY_SECONDS`.

### Flow diagram

```
Password:  Browser ──POST /api/auth/login──▶ AuthService.login ──▶ Set access_token cookie
SSO:       SSO server ──get-redirect-uri (x-sso-api-key)──▶ signed token + redirectUri
           Browser  ──redirect /sso/callback?token&isPosp──▶ frontend
           frontend ──POST /api/v1/sso/verify-token──▶ SsoService ──▶ Set access_token cookie
Every request: JwtAuthGuard reads cookie ─▶ HierarchyScopeInterceptor attaches scope
```

---

## 3. Data scope resolution

After authentication, **every request** passes through
`HierarchyScopeInterceptor`, which calls `resolveHierarchyScope(user, prisma)`
(`server/src/common/auth/hierarchy-scope.util.ts`) and attaches a
`HierarchyScope` to the request. Controllers forward this scope to query/command
handlers, which narrow every DB query accordingly.

```ts
interface HierarchyScope {
  zoneIds?: string[];
  regionIds?: string[];
  areaIds?: string[];
  districtIds?: string[]; // primary territory key for managers
  pospIds?: string[];     // POSP self
}
```

### Resolution rules

| Role | Resolved scope | Effect |
|------|----------------|--------|
| `SUPER_ADMIN`, `NATIONAL_HEAD` | `{}` (empty) | Unrestricted — all data |
| `POSP` | `{ pospIds: [user.pospId] }` | Only their own records |
| `ZH` / `RH` / `ASM` / `DM` | `{ districtIds: [...] }` | Districts their org node covers |

For managers, the territory is **geographic, not title-based**. The pipeline is:

```
User.userId
  └─▶ SalesTeam.employeeCode               (the caller's Cognitensor UserCode)
        └─▶ OrgMember.userCode             (match in the org graph)
              └─▶ DistrictChain[]          (every district that member covers, transitively)
                    └─▶ districtIds         (the scope)
```

- `DistrictChain` already encodes transitive coverage (one row per
  `(district, member)`), so scoping is a single indexed lookup — no closure walk.
- If the caller has no `SalesTeam` record → `{ districtIds: [] }` (no access).
- `scopeDistrictIds(scope)` returns `null` for unrestricted callers, the
  district list for managers, or `[]` for POSP/unlinked.

The org chart, dashboard, and all list endpoints (deals, leads, POSPs,
customers, sales-team) intersect their queries with this scope, which is why an
unscoped caller sees everything and a manager sees only their subtree.

### Demo-account scope aliasing

The seeded demo manager logins (`zonal@`, `regional@`, `asm@`, `dm@roinet.com`)
use **synthetic** `employeeCode`s (`EMP-Z001`, etc.) that are not part of the
Cognitensor org graph, so they would otherwise resolve to an empty territory
(and an empty org chart). `resolveHierarchyScope` therefore aliases each
placeholder code onto a real `OrgMember.userCode` whose org `usertype` matches
the demo role, all drawn from one zone (RAMANUJ / Bihar-Jharkhand) so scopes nest
with distinct sizes:

| Demo `employeeCode` | Aliased to real code | Org `usertype` | Approx. district coverage |
|---------------------|----------------------|----------------|---------------------------|
| `EMP-Z001` (ZH)  | `RAMANUJ.BIHARJHKZM` | 10 (ZH) | ~43 |
| `EMP-R001` (RH)  | `PRABHAT.RHJKND` | 6 (RH) | ~15 |
| `EMP-A001` (ASM) | `RAHUL.ASMBIHAR` | 4 (ASM) | ~4 |
| `EMP-D001` (DM)  | `PRASHANTJHA.ASMBIHAR` | 4 (ASM) | 1 (smallest; no real DM tier) |

This alias lives in code (`DEMO_EMPLOYEE_CODE_ALIASES`), not seed data, so it
cannot collide with the unique `employeeCode` constraint and survives the weekly
org-graph sync. **Real accounts — whose `employeeCode` already matches an
`OrgMember` — never touch this map.**

---

## 4. Local setup and seed workflow

Cognitensor-synced data (org graph, POSPs, hierarchy users) is the **root** of
the app. App-owned CRM data (customers, leads, deals) is seeded separately and
can be reset without touching the org graph.

```bash
cd server
npm run snapshots:refresh   # optional — refresh JSON from live UAT (needs VPN)
npm run seed:all            # POSPs + hierarchy users + org graph (run once / weekly)
npm run db:seed             # demo @roinet.com accounts only
npm run seed:crm            # wipe customers, leads, deals (all empty)
```

| Script | What it touches |
|--------|-----------------|
| `snapshots:refresh` | `data/snapshots/*.json` from Cognitensor live API |
| `seed:all` | Synced POSPs, `@roinet.in` users, `OrgMember`, `DistrictChain` |
| `db:seed` | 7 demo `@roinet.com` logins + `SALES_TEAM_DEFS` |
| `seed:crm` | Wipes CRM tables — **customers, leads, and deals left empty** |

The weekly cron (`OrgSyncService`, Sundays 02:00) refreshes the org graph from
live Cognitensor. The org chart endpoint reads the DB only (no per-request API
call). To refresh on demand: `POST /api/sales-team/sync` (ZH+).

---

## 5. Login matrix — test every hierarchy level

**Full developer quick reference:** [Developer Login Matrix](./developer-login-matrix.md)
— unified table (demo + real accounts per role), seed commands, and per-level
checklist.

Summary below; see that doc for copy-paste logins and testing notes.

### Demo accounts (`@roinet.com`) — easy passwords

| Level | Email | Password | Scope | What to check |
|-------|-------|----------|-------|---------------|
| Super Admin | `superadmin@roinet.com` | `Admin@1234` | All data | Full lists, all filters, org chart |
| National Head | `national@roinet.com` | `National@123` | All data | Same as above |
| Zonal Head | `zonal@roinet.com` | `Zonal@1234` | ~43 districts (aliased → `RAMANUJ.BIHARJHKZM`, ZH) | Dashboard + scoped lists |
| Regional Head | `regional@roinet.com` | `Regional@123` | ~15 districts (aliased → `PRABHAT.RHJKND`, RH) | Smaller subtree |
| ASM | `asm@roinet.com` | `Asm@12345` | ~4 districts (aliased → `RAHUL.ASMBIHAR`, ASM) | Area-level scope |
| DM | `dm@roinet.com` | `Dm@123456` | 1 district (aliased → `PRASHANTJHA.ASMBIHAR`, smallest ASM) | Smallest manager scope |
| POSP (demo) | `posp@roinet.com` | `Posp@1234` | No POSP link when all CSPs are taken | Use real POSP row below |

### Real synced accounts (`@roinet.in`) — password = UserCode (case-sensitive)

| Level | Email | Password | Scope | Notes |
|-------|-------|----------|-------|-------|
| Admin | `vivek@roinet.in` | `VIVEK` | All data | Org chart card **Admin** |
| National Head | `hari.dutt@roinet.in` | `HARI.DUTT` | All data | Org chart card **National Head** |
| Super Zonal Head | `sachin.zhrajgujmp@roinet.in` | `SACHIN.ZHRAJGUJMP` | ~132 districts | Org chart card **Super Zonal Head** |
| Zonal Head | `ramanuj.biharjhkzm@roinet.in` | `RAMANUJ.BIHARJHKZM` | ~43 districts | True ZH usertype (10) |
| Regional Head | `shaikh.rhmaha@roinet.in` | `SHAIKH.RHMAHA` | ~38 districts | usertype 6 (RH) — app role **RH** |
| ASM | `rahul.asmbihar@roinet.in` | `RAHUL.ASMBIHAR` | ~4 districts | usertype 4 (ASM) — app role **ASM** |
| POSP | `shivraj.wanole@roinet.in` | `CSP023057` | Self only (district 330) | Real POSP; same CSP as demo `posp@` |

**Tester notes:**

- Geo filters (zone / region / state / district) resolve to Cognitensor numeric
  `districtId`s — CRM seed data uses those IDs so scoped filters return results.
- POSP accounts cannot open the org-chart API; they appear as leaves on manager
  charts.
- Roles are derived from Cognitensor **`usertype`**, not R-column position. Org
  chart labels (Admin, National Head, SZH, etc.) come from `OrgMember.role`.
  **Scope follows geography** (`employeeCode` → `DistrictChain`).
- The org graph's lowest manager tier is **ASM** (usertype 4). CSP/CSF/CMF
  (usertype 3/2/1) are field POSPs, not managers, so there is **no real `DM`
  account** to sync — the `dm@roinet.com` demo borrows the smallest ASM
  territory (`PRASHANTJHA.ASMBIHAR`, 1 district) to exercise the narrowest scope.

---

## 6. Endpoint reference

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | Public | Password login → cookie |
| POST | `/api/auth/logout` | Public | Clear cookie |
| POST | `/api/auth/signup-posp` | Deprecated | Do not use — POSPs sync from Cognitensor |
| PATCH | `/api/auth/approve-posp/:userId` | Deprecated | Was tied to self-signup flow |
| GET | `/api/auth/me` | Cookie | Current session user |
| POST | `/api/v1/sso/get-redirect-uri` | `x-sso-api-key` | SSO server → signed redirect URI |
| POST | `/api/v1/sso/verify-token` | Public | Frontend → verify token, set cookie |

---

## Related docs

- [Developer Login Matrix](./developer-login-matrix.md) — quick reference for local logins and seed workflow
- [Phase 3: Role-Based Access Control](./phase-3-role-based-access-control.md)
- [RBAC Decorators Guide](./RBAC_DECORATORS.md)
