# Developer Login Matrix

**Status**: Current  
**Last Updated**: June 17, 2026

Quick reference for local development and QA. Use these accounts to verify
scoped data, dashboard, geo filters, and org chart at every hierarchy level.

Full auth/scope details: [Authentication, Roles & Data Scope](./authentication-roles-and-scope.md).

---

## Local setup (run in order)

```bash
cd server
npm run snapshots:refresh   # optional — pull live Cognitensor JSON (needs VPN)
npm run seed:all            # root data: POSPs, org graph, @roinet.in users
npm run db:seed             # demo @roinet.com accounts (easy passwords)
npm run seed:crm            # wipe customers, leads, deals (all empty)
```

| Script | Resets / touches |
|--------|------------------|
| `seed:all` | Cognitensor root — **do not wipe casually** |
| `db:seed` | Demo `@roinet.com` users + `SALES_TEAM_DEFS` only |
| `seed:crm` | Wipes `Customer`, `Lead`, `Deal` — **all three left empty** |

Login endpoint: `POST /api/auth/login` with `{ "email", "password" }` → HttpOnly cookie.

---

## Master login matrix

One row per hierarchy level. **Demo** accounts use simple passwords; **Real**
accounts come from Cognitensor sync (`seed:all`) and are preferred for realistic
testing.

| Level | Role | Demo email | Demo password | Real email | Real password | Org label | Approx. scope | Org chart |
|-------|------|------------|---------------|------------|---------------|-----------|---------------|-----------|
| System | `SUPER_ADMIN` | `superadmin@roinet.com` | `Admin@1234` | — | — | — | All data | Full tree |
| Admin | `NATIONAL_HEAD` | — | — | `vivek@roinet.in` | `VIVEK` | Admin | All data | Full tree |
| National Head | `NATIONAL_HEAD` | `national@roinet.com` | `National@123` | `hari.dutt@roinet.in` | `HARI.DUTT` | National Head | All data | Focus on self |
| Zonal | `ZH` | `zonal@roinet.com` | `Zonal@1234` | `ramanuj.biharjhkzm@roinet.in` | `RAMANUJ.BIHARJHKZM` | Zonal Head | Scoped | Scoped subtree |
| Super Zonal | `ZH` | — | — | `sachin.zhrajgujmp@roinet.in` | `SACHIN.ZHRAJGUJMP` | Super Zonal Head | ~132 districts | Scoped subtree |
| Regional | `RH` | `regional@roinet.com` | `Regional@123` | `shaikh.rhmaha@roinet.in` | `SHAIKH.RHMAHA` | Regional Head | ~38 districts | Scoped subtree |
| Area | `ASM` | `asm@roinet.com` | `Asm@12345` | `shaikh.rhmaha@roinet.in` | `SHAIKH.RHMAHA` | Area Sales Manager | ~38 districts | Scoped subtree |
| District | `DM` | `dm@roinet.com` | `Dm@123456` | `mundhe.asmmaha@roinet.in` | `MUNDHE.ASMMAHA` | District Manager | ~13 districts | Scoped subtree |
| Field agent | `POSP` | `posp@roinet.com` | `Posp@1234` | `shivraj.wanole@roinet.in` | `CSP023057` | Self only | N/A (leaf node) |

### Demo manager scope aliasing

Demo `@roinet.com` managers use synthetic `employeeCode`s (`EMP-Z001`, etc.) that
are **not** in the Cognitensor org graph. Scope is aliased in code to a real
chain so lists and org chart still work:

| Demo role | `employeeCode` | Aliased to real `UserCode` |
|-----------|----------------|----------------------------|
| ZH | `EMP-Z001` | `RAMANUJ.BIHARJHKZM` |
| RH | `EMP-R001` | `SACHIN.ZHRAJGUJMP` (SZH org label) |
| ASM | `EMP-A001` | `SHAIKH.RHMAHA` |
| DM | `EMP-D001` | `MUNDHE.ASMMAHA` |

Source: `server/src/common/auth/hierarchy-scope.util.ts` → `DEMO_EMPLOYEE_CODE_ALIASES`.

---

## What to verify per level

| Level | Suggested account | Check |
|-------|-------------------|-------|
| Super Admin | `superadmin@roinet.com` | All customers/deals/leads visible; all geo filters; full org chart |
| Admin | `vivek@roinet.in` | Org chart card **Admin**; all data |
| National Head | `hari.dutt@roinet.in` | Org chart card **National Head**; all data; chart opens on own card |
| Super Zonal Head | `sachin.zhrajgujmp@roinet.in` | Org chart card **Super Zonal Head**; ~132 districts |
| Zonal Head | `ramanuj.biharjhkzm@roinet.in` or `zonal@roinet.com` | Scoped lists; org chart focused on self |
| ASM | `shaikh.rhmaha@roinet.in` | Further reduced scope |
| DM | `mundhe.asmmaha@roinet.in` | Smallest manager territory (~13 districts) |
| POSP | `shivraj.wanole@roinet.in` | Only own deals; no org-chart page access |

After `seed:crm`, **customers, leads, and deals are empty** — add them via the app
to test create flows. Re-run `npm run seed:crm` anytime without touching the org graph.

---

## Account types

### Demo (`@roinet.com`)

- Created by `npm run db:seed`
- Simple memorable passwords
- Manager scope via **code aliasing** (see table above)
- `posp@roinet.com` may have no `pospId` link when all synced CSPs already have
  users — use a real POSP row for field-agent testing

### Real synced (`@roinet.in` + POSP emails)

- Created by `npm run seed:all` from Cognitensor snapshots
- Manager email: `<usercode-lowercase>@roinet.in`
- **Password = `UserCode`** (case-sensitive, e.g. `HARI.DUTT`)
- POSP email: actual `EmailId` from snapshot (e.g. `shivraj.wanole@roinet.in`)
- Scope resolves directly from `SalesTeam.employeeCode` → `OrgMember` → `DistrictChain`
- **Preferred** for realistic end-to-end testing

### Finding more synced accounts

Every org-graph member has a `@roinet.in` login. Pattern:

```
email:    <userCode.toLowerCase()>@roinet.in
password: <userCode>   # exact case from hierarchy snapshot
```

There are 133+ hierarchy users and 268 synced POSPs after `seed:all`.

---

## Important notes for developers

1. **Scope is geographic, not title-based** — a user's visible data is the set
   of districts their `OrgMember` covers in `DistrictChain`, not their `User.role`
   label in the DB.

2. **CRM geo must use Cognitensor IDs** — customers, leads, and deals need real
   `districtId` / `zoneId` / `regionId` for scoped filters to return rows. Use
   `npm run seed:crm`; do not rely on old synthetic `zone-west` seed data.

3. **Org chart reads the DB** — `GET /api/sales-team/org-chart` serves the
   persisted org graph (weekly sync), not live Cognitensor per request.

4. **POSP and org chart** — POSP role cannot call the org-chart API; POSPs appear
   as leaf nodes on manager charts only.

5. **SSO** — POSP SSO (`isPosp=true`) is implemented; manager SSO is not yet.
   Local dev uses password login.

---

## Related docs

- [Authentication, Roles & Data Scope](./authentication-roles-and-scope.md) — flows, scope resolution, SSO
- [RBAC Decorators Guide](./RBAC_DECORATORS.md) — `@MinRole`, `@Roles`, guards
