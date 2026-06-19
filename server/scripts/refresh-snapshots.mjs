/**
 * Refreshes server/data/snapshots/*.json from the live Cognitensor (UAT) API.
 *
 * Requires VPN / UAT network access. Snapshots are the offline fallback used
 * when USE_EXTERNAL_API_SNAPSHOT=true (local dev). The weekly OrgSyncService
 * cron pulls live directly and does NOT depend on these files; this script just
 * keeps the committed fallback data fresh.
 *
 * Run:  node scripts/refresh-snapshots.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const BASE = 'https://uatserviceapi.roinet.in';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'snapshots');

async function post(endpoint, body) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : '',
  });
  if (!res.ok) throw new Error(`${endpoint} -> ${res.status} ${res.statusText}`);
  const json = await res.json();
  return json.Data ?? [];
}

function write(filename, data) {
  const file = path.join(SNAPSHOT_DIR, filename);
  fs.writeFileSync(file, JSON.stringify({ Data: data }, null, 2), 'utf-8');
  console.log(`  ✓ ${filename.padEnd(22)} ${data.length} rows`);
}

async function main() {
  console.log('🔄 Refreshing Cognitensor snapshots from live UAT API…');

  const hierarchy = await post('/Cognitensor/ListHierarchyUserData');
  write('hierarchy.json', hierarchy);

  const zones = await post('/Cognitensor/ListZone');
  write('zones.json', zones);

  const states = await post('/Cognitensor/ListState');
  write('states.json', states);

  // ListDistrict errors on an empty stateid, so iterate per state and merge.
  const districtById = new Map();
  for (const s of states) {
    try {
      const rows = await post('/Cognitensor/ListDistrict', { stateid: s.StateId });
      for (const d of rows) districtById.set(d.DistrictId, d);
    } catch (err) {
      console.warn(`  ! districts for state ${s.StateId} failed: ${err.message}`);
    }
  }
  write('districts-sample.json', [...districtById.values()]);

  const posps = await post('/Cognitensor/ListPospData');
  write('posps.json', posps);

  console.log('✅ Snapshots refreshed.');
}

main().catch((err) => {
  console.error('❌ Refresh failed:', err);
  process.exit(1);
});
