/**
 * Copies raw Cognitensor captures from ../api-responses/ into
 * server/data/snapshots/*.json (offline fallback for USE_EXTERNAL_API_SNAPSHOT).
 *
 * The api-responses folder is gitignored (large JSON dumps from UAT). Run this
 * after dropping updated files there, then optionally:
 *   npm run seed:all          — refresh DB from snapshots
 *   node ../scripts/capture-app-api-responses.mjs — refresh responses/
 *
 * Run: node scripts/sync-snapshots-from-api-responses.mjs
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_RESPONSES_DIR = path.join(__dirname, '..', '..', 'api-responses');
const SNAPSHOT_DIR = path.join(__dirname, '..', 'data', 'snapshots');
const REFERENCE_DIR = path.join(__dirname, '..', 'data', 'reference');

/** @type {Array<{ src: string; dest: string; merge?: 'districts' | 'posps' | 'direct' }>} */
const MAP = [
  { src: 'list-state.json', dest: 'states.json', merge: 'direct' },
  { src: 'list-zone.json', dest: 'zones.json', merge: 'direct' },
  { src: 'list-district.json', dest: 'districts-sample.json', merge: 'districts' },
  { src: 'list-hierarchy-user-data.json', dest: 'hierarchy.json', merge: 'direct' },
  { src: 'list-posp-data.json', dest: 'posps.json', merge: 'posps' },
  { src: 'list-city.json', dest: 'cities-sample.json', merge: 'direct' },
];

function readJson(filePath) {
  let text = fs.readFileSync(filePath, 'utf-8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  return JSON.parse(text);
}

function loadData(filename) {
  const file = path.join(API_RESPONSES_DIR, filename);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${file}`);
  }
  const json = readJson(file);
  const data = json.Data;
  if (!Array.isArray(data)) {
    throw new Error(`${filename}: expected { Data: [] } envelope`);
  }
  return data;
}

function loadExistingSnapshot(dest) {
  const file = path.join(SNAPSHOT_DIR, dest);
  if (!fs.existsSync(file)) return new Map();
  const data = readJson(file).Data ?? [];
  const key = dest.includes('posp') ? 'UserCode' : 'DistrictId';
  return new Map(data.map((row) => [String(row[key] ?? row.DistrictId), row]));
}

function mergeDistrictRow(incoming, existing) {
  if (!existing) return incoming;
  return {
    ...existing,
    ...incoming,
    regionid: incoming.regionid ?? existing.regionid,
    regionname: incoming.regionname ?? existing.regionname,
    zoneid: incoming.zoneid ?? existing.zoneid,
    zonename: incoming.zonename ?? existing.zonename,
  };
}

function mergePospRow(incoming, existing) {
  if (!existing) return incoming;
  return {
    ...incoming,
    username: incoming.username ?? existing.username,
  };
}

function writeSnapshot(dest, rows) {
  const file = path.join(SNAPSHOT_DIR, dest);
  fs.writeFileSync(file, JSON.stringify({ Data: rows }, null, 2), 'utf-8');
  console.log(`  ✓ ${dest.padEnd(24)} ${rows.length} rows`);
}

function syncReferenceFiles() {
  fs.mkdirSync(REFERENCE_DIR, { recursive: true });
  const src = path.join(API_RESPONSES_DIR, 'user-type.txt');
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(REFERENCE_DIR, 'user-type.txt'));
    console.log('  ✓ reference/user-type.txt');
  }
}

function main() {
  if (!fs.existsSync(API_RESPONSES_DIR)) {
    console.error(`❌ api-responses folder not found: ${API_RESPONSES_DIR}`);
    process.exit(1);
  }

  console.log('🔄 Syncing snapshots from api-responses/…');
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  for (const { src, dest, merge } of MAP) {
    const incoming = loadData(src);

    if (merge === 'districts') {
      const existing = loadExistingSnapshot(dest);
      const merged = incoming.map((row) =>
        mergeDistrictRow(row, existing.get(String(row.DistrictId))),
      );
      writeSnapshot(dest, merged);
      continue;
    }

    if (merge === 'posps') {
      const existing = loadExistingSnapshot(dest);
      const merged = incoming.map((row) =>
        mergePospRow(row, existing.get(String(row.UserCode))),
      );
      const withUsername = merged.filter((r) => r.username).length;
      writeSnapshot(dest, merged);
      if (withUsername < merged.length) {
        console.log(
          `    ⚠ ${merged.length - withUsername} POSPs lack username — run refresh-snapshots.mjs on UAT for names`,
        );
      }
      continue;
    }

    writeSnapshot(dest, incoming);
  }

  syncReferenceFiles();
  console.log('✅ Snapshots synced from api-responses/.');
}

main();
