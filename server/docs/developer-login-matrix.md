# Developer Login Matrix

**Status**: Current  
**Last Updated**: June 21, 2026

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

## Cognitensor org roles (`usertype`)

Full mapping: [`server/data/reference/user-type.txt`](../data/reference/user-type.txt).

| `usertype` | Org role | Label | App login role* | Manager / field |
|------------|----------|-------|-----------------|-----------------|
| 0 | `ADMIN` | Admin (VIVEK) | `NATIONAL_HEAD` | System |
| 0 | `NATIONAL_HEAD` | National Head | `NATIONAL_HEAD` | National |
| 14 | `SZH` | Super Zonal Head | `ZH` | Manager |
| 10 | `ZH` | Zonal Head | `ZH` | Manager |
| 12 | `CH` | Cluster Head | `RH` | Manager |
| 6 | `RH` | Regional Head | `RH` | Manager |
| 11 | `ASSISTASM` | Assistant Area Sales Manager | `ASM` | Manager |
| 4 | `ASM` | Area Sales Manager | `ASM` | Manager |
| 2 | `CSF` | CSF | `DM` / `POSP` | Field (POSP roster) |
| 1 | `CMF` | CMF | `DM` / `POSP` | Field (POSP roster) |
| 3 | `CSP` | CSP | `DM` / `POSP` | Field (POSP roster) |

\* **App login role** = CRM `User.role` for RBAC and dashboard geo floor. **Org role**
comes from Cognitensor `usertype` and is what the org chart / filter designation
shows. Example: a Cluster Head (`usertype` 12) logs in with app role `RH` but
their card reads **Cluster Head**.

---

## Master login matrix

One row per testable level. **Demo** accounts use simple passwords; **Real**
accounts come from Cognitensor sync (`seed:all`) and are preferred for realistic
testing.

| Level | Org role | `usertype` | App role | Demo email | Demo password | Real email | Real password | Approx. scope | Dashboard filters |
|-------|----------|------------|----------|------------|---------------|------------|---------------|---------------|-------------------|
| System | — | — | `SUPER_ADMIN` | `superadmin@roinet.com` | `Admin@1234` | — | — | All data | Role groups + geo (no cascade) |
| Admin | `ADMIN` | 0 | `NATIONAL_HEAD` | — | — | `vivek@roinet.in` | `VIVEK` | All data | Role groups + geo |
| National Head | `NATIONAL_HEAD` | 0 | `NATIONAL_HEAD` | `national@roinet.com` | `National@123` | `hari.dutt@roinet.in` | `HARI.DUTT` | All data | Role groups + geo |
| Super Zonal Head | `SZH` | 14 | `ZH` | — | — | `sachin.zhrajgujmp@roinet.in` | `SACHIN.ZHRAJGUJMP` | ~132 districts | Cascade (ZH) + role groups + geo |
| Super Zonal Head | `SZH` | 14 | `ZH` | — | — | `kajal.bhadra szh@roinet.in` | `KAJAL.BHADRA SZH` | multi-zone | Same as above |
| Zonal Head | `ZH` | 10 | `ZH` | `zonal@roinet.com` | `Zonal@1234` | `ramanuj.biharjhkzm@roinet.in` | `RAMANUJ.BIHARJHKZM` | ~43 districts | Cascade (CH) + role groups + geo |
| Cluster Head | `CH` | 12 | `RH` | — | — | `chintu.asmbihar@roinet.in` | `CHINTU.ASMBIHAR` | subset of ZH | Cascade (ASM) + role groups + geo |
| Regional Head | `RH` | 6 | `RH` | `regional@roinet.com` | `Regional@123` | `shaikh.rhmaha@roinet.in` | `SHAIKH.RHMAHA` | ~38 districts | Cascade (ASM) + role groups + geo |
| Assistant ASM | `ASSISTASM` | 11 | `ASM` | — | — | `sandrapati.asmap@roinet.in` | `SANDRAPATI.ASMAP` | district-level | Cascade (ASM) + role groups + geo |
| Area Sales Manager | `ASM` | 4 | `ASM` | `asm@roinet.com` | `Asm@12345` | `rahul.asmbihar@roinet.in` | `RAHUL.ASMBIHAR` | ~4 districts | Cascade (POSP) + geo |
| District (demo only) | `ASM`* | 4 | `DM` | `dm@roinet.com` | `Dm@123456` | — | — | 1 district | Cascade (POSP) + geo |
| Field agent (CSP) | `CSP` | 3 | `POSP` | `posp@roinet.com` | `Posp@1234` | `shivraj.wanole@roinet.in` | `CSP023057` | Self only | None (no scope bar) |

\* Demo **DM** has no Cognitensor tier; it aliases the smallest ASM territory
(`PRASHANTJHA.ASMBIHAR`). CSF / CMF / CSP users are field agents on the POSP
roster — use any synced POSP email from `data/snapshots/posps.json`, not a
separate manager login row.

### Demo manager scope aliasing

Demo `@roinet.com` managers use synthetic `employeeCode`s (`EMP-Z001`, etc.) that
are **not** in the Cognitensor org graph. Scope is aliased in code to a real
chain so lists and org chart still work:

All four targets sit in one zone (RAMANUJ / Bihar-Jharkhand) and each `usertype`
matches the demo role, so scopes nest with distinct sizes:

| Demo role | `employeeCode` | Aliased to real `UserCode` | Org `usertype` | Approx. scope |
|-----------|----------------|----------------------------|----------------|---------------|
| ZH | `EMP-Z001` | `RAMANUJ.BIHARJHKZM` | 10 (ZH) | ~43 districts |
| RH | `EMP-R001` | `PRABHAT.RHJKND` | 6 (RH) | ~15 districts |
| ASM | `EMP-A001` | `RAHUL.ASMBIHAR` | 4 (ASM) | ~4 districts |
| DM | `EMP-D001` | `PRASHANTJHA.ASMBIHAR` | 4 (ASM) | 1 district |

The org graph's lowest manager tier is ASM (usertype 4) — CSP/CSF/CMF are field
POSPs, not managers — so the `DM` demo borrows the smallest ASM territory.

Source: `server/src/common/auth/hierarchy-scope.util.ts` → `DEMO_EMPLOYEE_CODE_ALIASES`.

---

## What to verify per level

| Org role | Suggested account | Check |
|----------|-------------------|-------|
| Super Admin | `superadmin@roinet.com` | All data; role-group + geo filters; full org chart |
| Admin | `vivek@roinet.in` | Org chart card **Admin**; unrestricted data |
| National Head | `hari.dutt@roinet.in` | Card **National Head**; role groups (no cascade) |
| Super Zonal Head | `sachin.zhrajgujmp@roinet.in` | Card **Super Zonal Head**; cascade shows ZH tier; ~132 districts |
| Zonal Head | `ramanuj.biharjhkzm@roinet.in` | Cascade shows **CH** only (not mixed RH/ASM); ~43 districts |
| Cluster Head | `chintu.asmbihar@roinet.in` | Card **Cluster Head**; app role `RH`; ASM cascade below |
| Regional Head | `shaikh.rhmaha@roinet.in` | Cascade **ASM** only (rank inversions excluded); ~38 districts |
| Assistant ASM | `sandrapati.asmap@roinet.in` | Card **Assistant ASM**; scoped under RH/ASM chain |
| ASM | `rahul.asmbihar@roinet.in` | Cascade to POSPs; ~4 districts |
| DM (demo) | `dm@roinet.com` | Smallest manager scope (1 district); POSP cascade |
| CSP / POSP | `shivraj.wanole@roinet.in` | Own deals only; no org-chart page; no dashboard filters |

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
