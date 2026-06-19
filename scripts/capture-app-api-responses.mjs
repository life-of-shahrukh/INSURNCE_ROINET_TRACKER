/**
 * Hits local NestJS endpoints and saves JSON responses under ../responses/
 * Run: node scripts/capture-app-api-responses.mjs
 * Requires server at http://localhost:8000
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const RESPONSES_DIR = path.join(ROOT, 'responses');
const BASE = process.env.API_BASE ?? 'http://localhost:8000';

const LOGIN = {
  email: 'superadmin@roinet.com',
  password: 'Admin@1234',
};

/** @type {Array<{ id: string; method: string; path: string; auth?: boolean; body?: unknown; note?: string }>} */
const ENDPOINTS = [
  { id: 'health', method: 'GET', path: '/health', auth: false },
  { id: 'api-root', method: 'GET', path: '/api', auth: false },
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/login',
    auth: false,
    body: LOGIN,
    note: 'Sets access_token cookie for subsequent requests',
  },
  { id: 'auth-me', method: 'GET', path: '/api/auth/me', auth: true },
  { id: 'profile', method: 'GET', path: '/api/profile', auth: true },
  { id: 'dashboard-stats', method: 'GET', path: '/api/dashboard/stats', auth: true },
  {
    id: 'hierarchy-filter-options',
    method: 'GET',
    path: '/api/hierarchy/filter-options',
    auth: true,
  },
  {
    id: 'hierarchy-org-chart',
    method: 'GET',
    path: '/api/hierarchy/org-chart',
    auth: true,
  },
  {
    id: 'external-states',
    method: 'GET',
    path: '/api/external/states',
    auth: true,
  },
  {
    id: 'external-districts',
    method: 'GET',
    path: '/api/external/districts?stateId=25',
    auth: true,
  },
  {
    id: 'external-cities',
    method: 'GET',
    path: '/api/external/cities?districtId=1',
    auth: true,
  },
  {
    id: 'external-zones',
    method: 'GET',
    path: '/api/external/zones',
    auth: true,
    note: 'Cognitensor ListZone — zonal lookup (Zoneid/ZoneName)',
  },
  {
    id: 'geo-catalog',
    method: 'GET',
    path: '/api/geo/catalog',
    auth: true,
    note: 'Small geo reference lists (zones/regions/states) — loaded once on the client',
  },
  {
    id: 'geo-districts-search',
    method: 'GET',
    path: '/api/geo/districts/search?q=hyd&limit=5',
    auth: true,
    note: 'Server-side district typeahead (big dataset, never bulk-loaded)',
  },
  {
    id: 'geo-cities-search',
    method: 'GET',
    path: '/api/geo/cities/search?q=ban&limit=5',
    auth: true,
    note: 'Server-side city typeahead (big dataset, never bulk-loaded)',
  },
  {
    id: 'hierarchy-members-search',
    method: 'GET',
    path: '/api/hierarchy/members/search?q=a&limit=5',
    auth: true,
    note: 'Scoped member/user typeahead by name or code',
  },
  {
    id: 'external-hierarchy',
    method: 'GET',
    path: '/api/external/hierarchy',
    auth: true,
  },
  {
    id: 'external-hierarchy-filtered',
    method: 'GET',
    path: '/api/external/hierarchy?districtId=1',
    auth: true,
  },
  {
    id: 'external-posps',
    method: 'GET',
    path: '/api/external/posps?page=1&pageSize=3',
    auth: true,
  },
  { id: 'posp-list', method: 'GET', path: '/api/posp?page=1&pageSize=3', auth: true },
  { id: 'deals-list', method: 'GET', path: '/api/deals?page=1&pageSize=3', auth: true },
  { id: 'leads-list', method: 'GET', path: '/api/leads?page=1&pageSize=3', auth: true },
  {
    id: 'leads-commitment',
    method: 'GET',
    path: '/api/leads/commitment',
    auth: true,
  },
  {
    id: 'customers-list',
    method: 'GET',
    path: '/api/customers?page=1&pageSize=3',
    auth: true,
  },
  {
    id: 'customers-search',
    method: 'GET',
    path: '/api/customers/search?q=a',
    auth: true,
  },
  {
    id: 'sales-team-list',
    method: 'GET',
    path: '/api/sales-team?page=1&pageSize=3',
    auth: true,
  },
  {
    id: 'sales-team-hierarchy',
    method: 'GET',
    path: '/api/sales-team/hierarchy',
    auth: true,
  },
  {
    id: 'sales-team-org-chart',
    method: 'GET',
    path: '/api/sales-team/org-chart',
    auth: true,
  },
];

function slug(id) {
  return id.replace(/[^a-z0-9-]/gi, '-');
}

async function request(method, urlPath, cookie, body) {
  const url = `${BASE}${urlPath}`;
  const headers = { Accept: 'application/json' };
  if (cookie) headers.Cookie = cookie;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const setCookie = res.headers.get('set-cookie') ?? '';
  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, statusText: res.statusText, data, setCookie };
}

async function main() {
  fs.mkdirSync(RESPONSES_DIR, { recursive: true });

  let cookie = '';
  const captured = [];

  for (const ep of ENDPOINTS) {
    if (ep.auth && !cookie) {
      console.warn(`Skipping ${ep.id}: no session cookie yet`);
      continue;
    }

    try {
      const result = await request(ep.method, ep.path, ep.auth ? cookie : '', ep.body);
      if (result.setCookie && ep.id === 'auth-login') {
        const match = result.setCookie.match(/access_token=[^;]+/);
        if (match) cookie = match[0];
      }

      const out = {
        capturedAt: new Date().toISOString(),
        method: ep.method,
        path: ep.path,
        baseUrl: BASE,
        status: result.status,
        statusText: result.statusText,
        note: ep.note ?? null,
        requestBody: ep.body ?? null,
        response: result.data,
      };

      const file = path.join(RESPONSES_DIR, `${slug(ep.id)}.json`);
      fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf-8');
      captured.push({ ...ep, status: result.status, file: path.relative(ROOT, file) });
      console.log(`${result.status} ${ep.method} ${ep.path} -> ${path.basename(file)}`);
    } catch (err) {
      console.error(`FAILED ${ep.method} ${ep.path}:`, err.message);
      captured.push({ ...ep, status: 'error', error: err.message });
    }
  }

  // Subordinates drill-down (needs a code from filter-options)
  if (cookie) {
    try {
      const filterFile = path.join(RESPONSES_DIR, 'hierarchy-filter-options.json');
      if (fs.existsSync(filterFile)) {
        const filter = JSON.parse(fs.readFileSync(filterFile, 'utf-8'));
        const sub = filter.response?.subordinates?.[0];
        if (sub?.id && filter.response?.nextLevel) {
          const drillPath = `/api/hierarchy/subordinates?level=${encodeURIComponent(filter.response.nextLevel)}&code=${encodeURIComponent(sub.id)}`;
          const result = await request('GET', drillPath, cookie);
          const out = {
            capturedAt: new Date().toISOString(),
            method: 'GET',
            path: drillPath,
            baseUrl: BASE,
            status: result.status,
            statusText: result.statusText,
            note: `Drill into first subordinate: ${sub.name} (${sub.id})`,
            response: result.data,
          };
          const file = path.join(RESPONSES_DIR, 'hierarchy-subordinates-drill.json');
          fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf-8');
          captured.push({
            id: 'hierarchy-subordinates-drill',
            method: 'GET',
            path: drillPath,
            auth: true,
            status: result.status,
            file: path.relative(ROOT, file),
          });
          console.log(`${result.status} GET ${drillPath} -> hierarchy-subordinates-drill.json`);
        }
      }
    } catch (err) {
      console.error('Subordinates drill failed:', err.message);
    }
  }

  fs.writeFileSync(
    path.join(ROOT, 'api-endpoints', 'capture-manifest.json'),
    JSON.stringify({ capturedAt: new Date().toISOString(), baseUrl: BASE, endpoints: captured }, null, 2),
    'utf-8',
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
