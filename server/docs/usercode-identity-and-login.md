# UserCode Identity & Login Mapping

**Status**: Current  
**Last Updated**: June 21, 2026

This document explains how Cognitensor **`UserCode`** is the real identity key in
the CRM, why manager emails are synthesized, and how password login today and
manager SSO in the future resolve to the same user, role, and data scope.

Related docs:

- [Authentication, Roles & Data Scope](./authentication-roles-and-scope.md) — JWT, SSO endpoints, scope rules
- [Developer Login Matrix](./developer-login-matrix.md) — copy-paste test accounts
- [Cognitensor External API](./cognitensor-external-api.md) — upstream API shapes and snapshot sync

---

## 1. Core principle: `UserCode` is the identity

Cognitensor identifies every hierarchy manager and every POSP with a **`UserCode`**
(for example `HARI.DUTT`, `KAJAL.BHADRA SZH`, `CSP023057`).

The CRM treats `UserCode` as the **business identity**. Everything that matters
after authentication — role label, RBAC bucket, geographic scope, org chart
position, filters — is resolved through that code, not through the login email.

| Stored where | Field | Example (`HARI.DUTT`) |
|--------------|-------|------------------------|
| Cognitensor snapshot | `R*_UserCode` / `DistrictManagerCode` | `HARI.DUTT` |
| `SalesTeam` | `employeeCode` | `HARI.DUTT` |
| `OrgMember` | `userCode` | `HARI.DUTT` |
| `User` (login) | synthetic email derived from code | `hari.dutt@roinet.in` |

The synthetic email is only the **login handle** for password auth. The app does
not use email for manager scope after the session is created.

---

## 2. What Cognitensor provides (and does not)

### Hierarchy managers — `ListHierarchyUserData`

Each district row includes IDs, codes, names, and `usertype` — **no email field**.

```text
DistrictManagerCode, DistrictManagerName, usertype
R1_UserId, R1_UserCode, R1_UserName, R1_usertype
… through R7
```

See [`external-api.types.ts`](../src/common/external-api/external-api.types.ts)
(`ExternalHierarchyUser`).

### POSPs — `ListPospData`

POSP rows **do** include a real `EmailId` from Cognitensor (for example
`shivraj.wanole@roinet.in`). That email is stored in `Posp.email` and
`User.email` during `seed:all`.

| Person type | Email from Cognitensor? | CRM login email |
|-------------|-------------------------|-----------------|
| Hierarchy manager | **No** | `{userCode.toLowerCase()}@roinet.in` (CRM convention) |
| POSP | **Yes** (`EmailId`) | Same as Cognitensor `EmailId` |

---

## 3. Why manager emails are synthesized

This is **not** a testing-only shortcut. It is the current production approach
because:

1. `ListHierarchyUserData` never returns manager emails.
2. The CRM still needs a `User` row with an `email` column for password login
   and JWT sessions.
3. A deterministic formula creates one login per synced org member without a
   second master-data API.

Seed logic (`sync-from-snapshots.ts`, Phase B):

```text
email:        <userCode.toLowerCase()>@roinet.in
password:     <userCode>   # exact case, hashed with bcrypt
employeeCode: <userCode>
designation:  org role from usertype (e.g. NATIONAL_HEAD, SZH, CH)
```

**Note:** If the upstream `UserCode` contains spaces (for example
`KAJAL.BHADRA SZH`), the synthetic email keeps them:
`kajal.bhadra szh@roinet.in`.

Managers are **never** invented at login time. They must already exist from
`npm run seed:all` (or weekly org sync). Same rule as POSP SSO today.

---

## 4. End-to-end data flow

```text
Cognitensor ListHierarchyUserData
        │
        ▼  snapshots:refresh / seed:all
┌───────────────────────────────────────────────────┐
│  OrgMember.userCode     ← buildOrgGraph           │
│  SalesTeam.employeeCode ← seed Hierarchy Users    │
│  User.email             ← derived from UserCode   │
│  DistrictChain          ← districts per member    │
└───────────────────────────────────────────────────┘
        │
        ▼  login (password today, SSO future)
   JWT cookie (User.id, role, pospId?)
        │
        ▼  every scoped API request
SalesTeam.employeeCode → OrgMember.userCode → districtIds / filters / org chart
```

Key code paths:

- Seed: [`sync-from-snapshots.ts`](../src/seed/sync-from-snapshots.ts) — Phase B
- Scope: [`hierarchy-scope.util.ts`](../src/common/auth/hierarchy-scope.util.ts) — `resolveHierarchyScope`
- Org chart / filters: [`hierarchy.service.ts`](../src/modules/hierarchy/hierarchy.service.ts) — `callerMemberId`
- Auth payload / UI role label: [`auth-payload.util.ts`](../src/modules/auth/auth-payload.util.ts)

---

## 5. Example: `HARI.DUTT` (National Head)

### At sync time (from `hierarchy.json`)

Cognitensor provides (among district chains):

```text
UserCode:  HARI.DUTT
UserName:  Hari Dutt
usertype:  0  →  org role NATIONAL_HEAD
```

The CRM stores:

| Layer | Value |
|-------|-------|
| `SalesTeam.employeeCode` | `HARI.DUTT` |
| `SalesTeam.designation` | `NATIONAL_HEAD` |
| `OrgMember.userCode` | `HARI.DUTT` |
| `OrgMember.role` | `NATIONAL_HEAD` |
| `User.role` | `NATIONAL_HEAD` (app RBAC bucket) |
| `User.email` | `hari.dutt@roinet.in` |

### Password login today

```http
POST /api/auth/login
{ "email": "hari.dutt@roinet.in", "password": "HARI.DUTT" }
```

1. Look up `User` by email.
2. Verify password hash of `UserCode`.
3. Issue JWT; `buildAuthUserPayload` sets `roleLabel: "National Head"`.
4. `resolveHierarchyScope` returns `{}` (unrestricted — all data).

### After login (any entry method)

Scope and UI **do not** use email. They use `UserCode`:

```text
User.userId
  → SalesTeam.employeeCode ("HARI.DUTT")
  → OrgMember.userCode ("HARI.DUTT")
  → DistrictChain / org graph
  → visible districts, filters, profile team summary
```

The app correctly answers: “this session is **Hari Dutt, National Head**” and
applies national-level scope.

---

## 6. Login today vs manager SSO (future)

Both paths must end at the **same** `User` record and the **same** post-login
behavior.

| Step | Password login (today) | Manager SSO (planned, `isPosp=false`) |
|------|------------------------|----------------------------------------|
| Entry | `email` + `password` | Signed SSO token with `userCode` |
| Lookup | `User` by synthetic email | `User` via `SalesTeam.employeeCode = userCode` |
| Session | HttpOnly `access_token` JWT | Same JWT |
| Scope / RBAC / UI | Via `employeeCode` → org graph | **Identical** |

POSP SSO (`isPosp=true`) is already implemented: the token carries `userCode`,
the service looks up `User` by `Posp.code`, and issues the same cookie.
[`sso.service.ts`](../src/modules/sso/sso.service.ts).

Manager SSO is stubbed (`NotImplementedException` when `isPosp=false`). The
intended implementation mirrors POSP:

```text
SSO token.userCode = "HARI.DUTT"
  → find User linked to SalesTeam.employeeCode = "HARI.DUTT"
  → if missing: 401 "No CRM account linked" (run seed:all first)
  → sign same JWT as password login
  → all downstream behavior unchanged
```

Optional future improvement: if Cognitensor or SSO later provides a real manager
`EmailId`, update `User.email` on login — but **identity and scope stay keyed on
`UserCode`**.

---

## 7. App role vs org role (why labels differ)

Cognitensor `usertype` maps to two concepts:

| Concept | Where stored | Example (Cluster Head) |
|---------|--------------|------------------------|
| **Org role** | `SalesTeam.designation`, `OrgMember.role` | `CH` → UI “Cluster Head” |
| **App role** | `User.role` (RBAC ladder) | `RH` |

`buildAuthUserPayload` exposes both: `role` for guards, `orgRole` / `roleLabel`
for the sidebar and profile. Scope follows **geography** (`UserCode` →
`DistrictChain`), not the app role label alone.

See [`user-type.util.ts`](../src/common/external-api/user-type.util.ts) and
[`user-type.txt`](../data/reference/user-type.txt).

---

## 8. Demo accounts vs real synced accounts

| Account set | Email | Identity key | Scope |
|-------------|-------|--------------|-------|
| Demo (`@roinet.com`) | Made up in `db:seed` | Synthetic `employeeCode` (`EMP-Z001`, …) aliased to a real `UserCode` | Via alias map in `hierarchy-scope.util.ts` |
| Real synced (`@roinet.in`) | `{userCode}@roinet.in` | Actual Cognitensor `UserCode` | Direct `employeeCode` → `OrgMember` |

Real accounts never hit the demo alias map. Demo accounts exist for easy
passwords during QA only.

---

## 9. Quick reference

```text
# Real manager login (after seed:all)
email:    <userCode.toLowerCase()>@roinet.in
password: <userCode>                    # case-sensitive

# Identity chain (password or future SSO)
UserCode → SalesTeam.employeeCode → OrgMember.userCode → scope

# POSP (different — real email from ListPospData)
email:    <EmailId from Cognitensor>
password: <UserCode> or SSO userCode
identity: Posp.code = UserCode
```

---

## 10. Related source files

| File | Responsibility |
|------|----------------|
| `server/src/seed/sync-from-snapshots.ts` | Creates `User` + `SalesTeam` from hierarchy snapshot |
| `server/src/common/org-graph/org-graph-builder.ts` | Builds `OrgMember` graph from same snapshot |
| `server/src/modules/auth/auth.service.ts` | Password login |
| `server/src/modules/sso/sso.service.ts` | SSO verify (POSP done; manager pending) |
| `server/src/common/auth/hierarchy-scope.util.ts` | Post-login territory resolution |
| `server/src/modules/auth/auth-payload.util.ts` | Session payload with org role labels |
