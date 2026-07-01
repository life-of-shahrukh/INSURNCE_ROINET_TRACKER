/**
 * Parses the "Payout Grids" Excel file and writes normalized JSON files
 * for each insurer into server/data/payout-grids/.
 *
 * Usage:
 *   node server/scripts/parse-payout-grids.mjs [path-to-xlsx]
 *
 * If no path is provided, defaults to ~/Downloads/payot Grids'.xlsx
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUTPUT_DIR = resolve(__dirname, '../data/payout-grids');

const inputPath =
  process.argv[2] ||
  resolve(process.env.HOME, "Downloads/payot Grids'.xlsx");

if (!existsSync(inputPath)) {
  console.error(`File not found: ${inputPath}`);
  process.exit(1);
}

console.log(`Reading: ${inputPath}`);
const workbook = XLSX.readFile(inputPath, { cellDates: true });
console.log(`Sheets: ${workbook.SheetNames.join(', ')}`);

function makeRowId(parts) {
  const raw = parts.filter(Boolean).join('|');
  return createHash('md5').update(raw).digest('hex').slice(0, 12);
}

function cleanVal(v) {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  if (s === '' || s === '0' || s === 'None') return null;
  return s;
}

function rateVal(v) {
  if (v === null || v === undefined || v === '') return '0';
  const s = String(v).trim();
  if (s === '' || s === 'None') return '0';
  const num = parseFloat(s);
  if (!isNaN(num)) return String(num);
  return s;
}

function writeGrid(slug, data) {
  const outPath = join(OUTPUT_DIR, `${slug}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`  -> ${outPath} (${data.rows.length} rows)`);
}

// ----------- CHOLA GRIDS -----------
function parseChola(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();
  const policyTypes = new Set();
  const oems = new Set();

  const oemHeaders = ['Hero OEM', 'TVS OEM', 'Suzuki OEM', 'Yamaha OEM', 'RE OEM', 'Honda', 'Bajaj', 'Others'];
  const ccHeaders = ['150cc', 'SCOOTER', '150_350cc', '350cc'];
  const electricCcHeaders = ['7 KW Bike', '7 KW SCOOTER', '7 KW - 16 KW', '> 16 KW'];

  let currentState = '';
  for (let r = 5; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const stateCell = String(row[1] || '').trim();
    if (stateCell) currentState = stateCell.replace(/\n/g, ' ');
    const typeCell = String(row[2] || '').trim();
    if (!typeCell || !currentState) continue;

    states.add(currentState);
    policyTypes.add(typeCell);

    let colIdx = 3;
    for (const oem of oemHeaders) {
      oems.add(oem);
      for (const cc of ccHeaders) {
        const val = rateVal(row[colIdx]);
        if (val && val !== '0') {
          rows.push({
            id: makeRowId([currentState, typeCell, oem, cc]),
            state: currentState,
            policyType: typeCell,
            oem,
            vehicleType: 'Two Wheeler',
            segment: cc,
            rates: { rate: val },
          });
        }
        colIdx++;
      }
      colIdx++; // skip empty separator column
    }

    // Electric section (starts around col 43)
    const elState = String(row[41] || '').trim();
    const elType = String(row[42] || '').trim();
    if (elType) {
      let elCol = 43;
      for (const cc of electricCcHeaders) {
        const val = rateVal(row[elCol]);
        if (val && val !== '0') {
          rows.push({
            id: makeRowId([currentState, elType, 'Electric', cc]),
            state: currentState,
            policyType: elType,
            oem: 'All Electric',
            vehicleType: 'TW Electric',
            segment: cc,
            rates: { rate: val },
          });
        }
        elCol++;
      }
    }
  }

  return {
    insurer: 'Chola',
    insurerSlug: 'chola',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: ['Two Wheeler', 'TW Electric'],
    states: [...states],
    policyTypes: [...policyTypes],
    columns: ['State', 'Policy Type', 'OEM', 'Vehicle Type', 'Segment', 'Rate'],
    rows,
  };
}

// ----------- BAJAJ (Pvt Car & TW TP) -----------
function parseBajaj(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();
  const vehicleTypes = new Set();

  let currentVehicleType = '';
  let currentSection = '';

  for (let r = 2; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const col0 = String(row[0] || '').trim();
    const col1 = String(row[1] || '').trim();
    const col2 = String(row[2] || '').trim();
    const col3 = String(row[3] || '').trim();

    if (col0 === 'PVT CAR & TW TP' || col0 === 'cv') continue;
    if (col0.startsWith('IRDA rate')) continue;
    if (col0.startsWith('GCV Comprehensive')) continue;
    if (col0.startsWith('In case of')) continue;

    // Detect section headers
    if (col0 === 'oca' || col0 === 'Segment') {
      currentSection = col0;
      continue;
    }

    if (col0 === 'Private Car' || col0 === 'Two Wheeler') {
      currentVehicleType = col0;
      vehicleTypes.add(currentVehicleType);
      if (col1) {
        states.add(col1);
        const rate = rateVal(col2);
        rows.push({
          id: makeRowId(['bajaj', currentVehicleType, col1, 'Standalone']),
          state: col1,
          vehicleType: currentVehicleType,
          policyType: 'Standalone TP',
          rates: { standalone: rate },
          remarks: cleanVal(col3),
        });
      }
      continue;
    }

    // CV section (Segment + Comprehensive/Standalone)
    if (currentSection === 'Segment' && col0) {
      currentVehicleType = col0;
      vehicleTypes.add(currentVehicleType);
      if (col1) {
        states.add(col1);
        rows.push({
          id: makeRowId(['bajaj', col0, col1, 'cv']),
          state: col1,
          vehicleType: col0,
          policyType: 'Comprehensive',
          rates: {
            comprehensive: rateVal(col2),
            standalone: rateVal(col3),
          },
          remarks: cleanVal(row[4]) || cleanVal(row[5]),
        });
      }
    }
  }

  return {
    insurer: 'Bajaj',
    insurerSlug: 'bajaj',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: [...vehicleTypes],
    states: [...states],
    policyTypes: ['Standalone TP', 'Comprehensive'],
    columns: ['State', 'Vehicle Type', 'Policy Type', 'Standalone', 'Comprehensive', 'Remarks'],
    rows,
  };
}

// ----------- BAJAJ 2 (TW Comp RTO Wise) -----------
function parseBajaj2(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();

  for (let r = 5; r < Math.min(raw.length, 36000); r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const rtoCode = String(row[0] || '').trim();
    const district = String(row[1] || '').trim();
    const stateName = String(row[2] || '').trim();

    if (!rtoCode || rtoCode === 'RTO Code') continue;

    states.add(stateName);

    const rateObj = {};
    const slabHeaders = ['0-50K', '50K-1L', '1L-2L', '2L-3L', '3L+'];
    for (let c = 4; c <= 8; c++) {
      const val = rateVal(row[c]);
      rateObj[slabHeaders[c - 4] || `col${c}`] = val;
    }
    const maxScooter = rateVal(row[10]);
    if (maxScooter) rateObj['maxScooter'] = maxScooter;

    rows.push({
      id: makeRowId(['bajaj2', rtoCode, district]),
      state: stateName,
      vehicleType: 'Two Wheeler',
      segment: `${rtoCode} - ${district}`,
      rates: rateObj,
    });
  }

  return {
    insurer: 'Bajaj (TW RTO)',
    insurerSlug: 'bajaj-tw-rto',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: ['Two Wheeler'],
    states: [...states],
    policyTypes: ['Comprehensive'],
    columns: ['RTO/District', 'State', '0-50K', '50K-1L', '1L-2L', '2L-3L', '3L+', 'Max Scooter'],
    rows,
  };
}

// ----------- GENERIC MULTI-COLUMN GRID (Digit, FUTURE, HDFC, TATA AIG, etc) -----------
function parseGenericGrid(ws, insurerName, insurerSlug) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();
  const vehicleTypes = new Set();
  const policyTypes = new Set();

  if (raw.length < 3) {
    return {
      insurer: insurerName,
      insurerSlug,
      lastUpdated: new Date().toISOString(),
      vehicleCategories: [],
      states: [],
      policyTypes: [],
      columns: [],
      rows: [],
    };
  }

  // Find header row (first row with multiple non-empty cells)
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    const nonEmpty = (raw[r] || []).filter(c => c && String(c).trim() !== '').length;
    if (nonEmpty >= 3) {
      headerRowIdx = r;
      break;
    }
  }

  const headers = (raw[headerRowIdx] || []).map(h => String(h || '').trim());
  const colCount = headers.length;

  for (let r = headerRowIdx + 1; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const rateObj = {};
    let state = '';
    let vehicleType = '';
    let policyType = '';
    let remarks = '';

    for (let c = 0; c < Math.min(row.length, colCount); c++) {
      const header = headers[c] || `col${c}`;
      const val = String(row[c] || '').trim();
      const headerLower = header.toLowerCase();

      if (headerLower.includes('state') || headerLower.includes('rto') || headerLower === 'zone') {
        state = val || state;
      } else if (headerLower.includes('segment') || headerLower.includes('vehicle') || headerLower.includes('type') || headerLower.includes('product') || headerLower === 'oca') {
        vehicleType = val || vehicleType;
      } else if (headerLower.includes('policy') || headerLower === 'category') {
        policyType = val || policyType;
      } else if (headerLower.includes('remark')) {
        remarks = val;
      } else if (val) {
        rateObj[header] = rateVal(val);
      }
    }

    if (!state && row[0]) state = String(row[0]).trim();
    if (state) states.add(state);
    if (vehicleType) vehicleTypes.add(vehicleType);
    if (policyType) policyTypes.add(policyType);

    if (Object.keys(rateObj).length > 0 || state) {
      rows.push({
        id: makeRowId([insurerSlug, state, vehicleType, policyType, r.toString()]),
        state: state || 'N/A',
        vehicleType: vehicleType || undefined,
        policyType: policyType || undefined,
        rates: rateObj,
        remarks: remarks || undefined,
      });
    }
  }

  return {
    insurer: insurerName,
    insurerSlug,
    lastUpdated: new Date().toISOString(),
    vehicleCategories: [...vehicleTypes],
    states: [...states],
    policyTypes: [...policyTypes],
    columns: ['State', ...headers.filter(h => h && !h.toLowerCase().includes('state') && !h.toLowerCase().includes('rto'))],
    rows,
  };
}

// ----------- MAGMA PVT CAR (Cluster x Fuel/NCB matrix) -----------
function parseMagmaPvtCar(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();

  // Find header row
  let headerIdx = 0;
  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    if (raw[r] && String(raw[r][0] || '').includes('Cluster')) {
      headerIdx = r;
      break;
    }
  }

  const subHeaders = raw[headerIdx + 1] || [];
  const rateHeaders = [];
  for (let c = 2; c < 12; c++) {
    const sub = String(subHeaders[c] || '').trim();
    rateHeaders.push(sub || `col${c}`);
  }

  for (let r = headerIdx + 2; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const state = String(row[0] || '').trim();
    const cluster = String(row[1] || '').trim();
    if (!state || state === 'Cluster State(25-26)') continue;

    states.add(state);
    const rateObj = {};
    for (let c = 2; c < 12; c++) {
      const val = rateVal(row[c]);
      rateObj[rateHeaders[c - 2]] = val;
    }

    rows.push({
      id: makeRowId(['magma-pvt-car', state, cluster]),
      state,
      vehicleType: 'Private Car',
      segment: cluster,
      rates: rateObj,
    });
  }

  return {
    insurer: 'Magma (Pvt Car)',
    insurerSlug: 'magma-pvt-car',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: ['Private Car'],
    states: [...states],
    policyTypes: ['Comprehensive'],
    columns: ['State', 'Cluster', ...rateHeaders],
    rows,
  };
}

// ----------- NATIONAL (Slab-based) -----------
function parseNational(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const policyTypes = new Set();
  const vehicleCategories = new Set();

  let currentSection = '';

  for (let r = 0; r < raw.length; r++) {
    const row = raw[r];
    if (!row) continue;

    const col0 = String(row[0] || '').trim();

    // Detect section headers
    if (col0.startsWith('1. Motor Private Car')) {
      currentSection = 'PVT_CAR_COMP';
      vehicleCategories.add('Private Car');
      continue;
    }
    if (col0.includes('Standalone Third-Party')) {
      currentSection = 'PVT_CAR_STP';
      continue;
    }
    if (col0.startsWith('2. Two-Wheeler')) {
      currentSection = 'TWO_WHEELER';
      vehicleCategories.add('Two Wheeler');
      continue;
    }
    if (col0.startsWith('3. Commercial Vehicle')) {
      currentSection = 'CV';
      vehicleCategories.add('Commercial Vehicle');
      continue;
    }
    if (col0.startsWith('4. Health')) {
      currentSection = 'HEALTH_NONMOTOR';
      vehicleCategories.add('Health');
      vehicleCategories.add('Non-Motor');
      continue;
    }

    // Parse slab rows (starts with a range like "0 - 10k" or ">10k")
    if (col0.match(/^[>0-9]/) && currentSection) {
      const rateObj = {};
      for (let c = 1; c < row.length; c++) {
        const val = rateVal(row[c]);
        if (val && val !== '0') rateObj[`col${c}`] = val;
      }

      const pType = currentSection.includes('STP') ? 'Standalone TP' : 'Comprehensive';
      policyTypes.add(pType);

      rows.push({
        id: makeRowId(['national', currentSection, col0]),
        state: 'National',
        vehicleType: currentSection.includes('PVT') ? 'Private Car' :
                     currentSection.includes('TWO') ? 'Two Wheeler' :
                     currentSection.includes('CV') ? 'Commercial Vehicle' : 'Health/Non-Motor',
        policyType: pType,
        segment: col0,
        rates: rateObj,
      });
      continue;
    }

    // Policy category rows (Health section)
    if (currentSection === 'HEALTH_NONMOTOR' && col0 && !col0.startsWith('Key') && !col0.startsWith('Electric') && !col0.startsWith('All ') && !col0.startsWith('Underwriting')) {
      const isHeader = col0 === 'Policy Category' || col0 === 'Cumulative Monthly Slab' || col0 === 'Slab (GWP Basis)' || col0 === 'Monthly Premium Volume';
      if (!isHeader && row[1]) {
        const rateObj = {};
        for (let c = 2; c < row.length; c++) {
          const val = rateVal(row[c]);
          if (val && val !== '0') rateObj[`col${c}`] = val;
        }
        policyTypes.add(col0);

        rows.push({
          id: makeRowId(['national', 'health', col0, String(row[1])]),
          state: 'National',
          vehicleType: 'Health/Non-Motor',
          policyType: col0,
          segment: String(row[1] || '').trim(),
          rates: rateObj,
        });
      }
    }
  }

  return {
    insurer: 'National',
    insurerSlug: 'national',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: [...vehicleCategories],
    states: ['National'],
    policyTypes: [...policyTypes],
    columns: ['Vehicle Type', 'Slab/Segment', 'Policy Type', 'Rates'],
    rows,
  };
}

// ----------- RELIANCE -----------
function parseReliance(ws) {
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const rows = [];
  const states = new Set();
  const vehicleTypes = new Set();

  // Header rows are at row index 2-3
  let headerRow1 = [];
  let headerRow2 = [];
  let dataStart = 4;

  for (let r = 0; r < Math.min(raw.length, 10); r++) {
    if (raw[r] && String(raw[r][0] || '').trim() === 'Zone') {
      headerRow1 = raw[r - 1] || [];
      headerRow2 = raw[r];
      dataStart = r + 1;
      break;
    }
  }

  // Build column headers from the two header rows
  const colHeaders = [];
  for (let c = 0; c < (headerRow2 || []).length; c++) {
    const h1 = String(headerRow1[c] || '').trim();
    const h2 = String(headerRow2[c] || '').trim();
    colHeaders.push(h2 || h1 || `col${c}`);
  }

  for (let r = dataStart; r < raw.length; r++) {
    const row = raw[r];
    if (!row || row.every(c => !c || String(c).trim() === '')) continue;

    const zone = String(row[0] || '').trim();
    const rtoState = String(row[1] || '').trim();
    const rtoRegion = String(row[2] || '').trim();

    if (!zone || zone === 'Zone') continue;

    const state = rtoRegion || rtoState;
    states.add(state);

    const rateObj = {};
    for (let c = 3; c < Math.min(row.length, colHeaders.length); c++) {
      const val = rateVal(row[c]);
      if (val && val !== '0') {
        rateObj[colHeaders[c] || `col${c}`] = val;
      }
    }

    if (Object.keys(rateObj).length > 0) {
      rows.push({
        id: makeRowId(['reliance', zone, state, r.toString()]),
        state,
        vehicleType: 'Commercial Vehicle',
        segment: `${zone} - ${rtoState}`,
        rates: rateObj,
      });
    }
  }

  return {
    insurer: 'Reliance',
    insurerSlug: 'reliance',
    lastUpdated: new Date().toISOString(),
    vehicleCategories: ['Commercial Vehicle', 'Two Wheeler'],
    states: [...states],
    policyTypes: ['Comprehensive', 'Standalone TP'],
    columns: ['Zone', 'State/RTO', 'Region', ...colHeaders.slice(3)],
    rows,
  };
}

// ----------- MAIN -----------
const sheetMap = [
  { name: 'Chola Grids ', parser: parseChola, slug: 'chola' },
  { name: 'BAJAJ ', parser: parseBajaj, slug: 'bajaj' },
  { name: 'BAJAJ 2', parser: parseBajaj2, slug: 'bajaj-tw-rto' },
  { name: 'Digit Payouts', parser: null, slug: 'digit' },
  { name: 'FUTURE', parser: null, slug: 'future' },
  { name: 'HDFC PVT CAR GRIDS  ', parser: null, slug: 'hdfc' },
  { name: 'TATA AIG', parser: null, slug: 'tata-aig' },
  { name: 'UNITED INDIA ', parser: null, slug: 'united-india' },
  { name: 'ZUNO ', parser: null, slug: 'zuno' },
  { name: 'ICICI ', parser: null, slug: 'icici' },
  { name: 'iffco ', parser: null, slug: 'iffco' },
  { name: 'MAGMA ', parser: null, slug: 'magma' },
  { name: 'MAGMA PVT CAR', parser: parseMagmaPvtCar, slug: 'magma-pvt-car' },
  { name: 'National', parser: parseNational, slug: 'national' },
  { name: 'Reliance ', parser: parseReliance, slug: 'reliance' },
];

let totalRows = 0;

for (const entry of sheetMap) {
  const ws = workbook.Sheets[entry.name];
  if (!ws) {
    console.warn(`Sheet "${entry.name}" not found, skipping.`);
    continue;
  }

  console.log(`\nParsing: ${entry.name} -> ${entry.slug}.json`);

  let result;
  if (entry.parser) {
    result = entry.parser(ws);
  } else {
    const displayName = entry.name.trim();
    result = parseGenericGrid(ws, displayName, entry.slug);
  }

  totalRows += result.rows.length;
  writeGrid(entry.slug, result);
}

console.log(`\nDone! Total rows across all grids: ${totalRows}`);
