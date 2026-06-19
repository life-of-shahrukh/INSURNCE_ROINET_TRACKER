# API Response Samples

Live snapshots captured from the local NestJS server. Each file includes HTTP status, path, and the JSON body returned.

**Last captured:** see `capturedAt` inside each file, or run:

```bash
node scripts/capture-app-api-responses.mjs
```

Endpoint catalog: [`../api-endpoints/README.md`](../api-endpoints/README.md)

---

## Index

| File | Method | Path | Status |
|------|--------|------|--------|
| [health.json](./health.json) | GET | `/health` | 200 |
| [auth-login.json](./auth-login.json) | POST | `/api/auth/login` | 200 |
| [auth-me.json](./auth-me.json) | GET | `/api/auth/me` | 200 |
| [profile.json](./profile.json) | GET | `/api/profile` | 200 |
| [dashboard-stats.json](./dashboard-stats.json) | GET | `/api/dashboard/stats` | 200 |
| [hierarchy-filter-options.json](./hierarchy-filter-options.json) | GET | `/api/hierarchy/filter-options` | 200 |
| [hierarchy-org-chart.json](./hierarchy-org-chart.json) | GET | `/api/hierarchy/org-chart` | 200 |
| [hierarchy-subordinates-drill.json](./hierarchy-subordinates-drill.json) | GET | `/api/hierarchy/subordinates?…` | 200 |
| [external-states.json](./external-states.json) | GET | `/api/external/states` | 200 |
| [external-districts.json](./external-districts.json) | GET | `/api/external/districts?stateId=25` | 200 |
| [external-cities.json](./external-cities.json) | GET | `/api/external/cities?districtId=1` | 200 |
| [external-zones.json](./external-zones.json) | GET | `/api/external/zones` | 200 |
| [geo-catalog.json](./geo-catalog.json) | GET | `/api/geo/catalog` | 200 |
| [geo-districts-search.json](./geo-districts-search.json) | GET | `/api/geo/districts/search?q=hyd&limit=5` | 200 |
| [geo-cities-search.json](./geo-cities-search.json) | GET | `/api/geo/cities/search?q=ban&limit=5` | 200 |
| [hierarchy-members-search.json](./hierarchy-members-search.json) | GET | `/api/hierarchy/members/search?q=a&limit=5` | 200 |
| [external-hierarchy.json](./external-hierarchy.json) | GET | `/api/external/hierarchy` | 200 |
| [external-hierarchy-filtered.json](./external-hierarchy-filtered.json) | GET | `/api/external/hierarchy?districtId=1` | 200 |
| [external-posps.json](./external-posps.json) | GET | `/api/external/posps?page=1&pageSize=3` | 200 |
| [posp-list.json](./posp-list.json) | GET | `/api/posp?page=1&pageSize=3` | 200 |
| [deals-list.json](./deals-list.json) | GET | `/api/deals?page=1&pageSize=3` | 200 |
| [leads-list.json](./leads-list.json) | GET | `/api/leads?page=1&pageSize=3` | 200 |
| [leads-commitment.json](./leads-commitment.json) | GET | `/api/leads/commitment` | 200 |
| [customers-list.json](./customers-list.json) | GET | `/api/customers?page=1&pageSize=3` | 200 |
| [customers-search.json](./customers-search.json) | GET | `/api/customers/search?q=a` | 200 |
| [sales-team-list.json](./sales-team-list.json) | GET | `/api/sales-team?page=1&pageSize=3` | 200 |
| [sales-team-hierarchy.json](./sales-team-hierarchy.json) | GET | `/api/sales-team/hierarchy` | 200 |
| [sales-team-org-chart.json](./sales-team-org-chart.json) | GET | `/api/sales-team/org-chart` | 200 |

---

## JSON file shape

```json
{
  "capturedAt": "2026-06-17T…",
  "method": "GET",
  "path": "/api/hierarchy/filter-options",
  "baseUrl": "http://localhost:8000",
  "status": 200,
  "statusText": "OK",
  "note": null,
  "requestBody": null,
  "response": { }
}
```

Open any `.json` file in the editor to inspect the full response body.
