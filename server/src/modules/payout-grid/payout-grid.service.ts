import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
} from 'node:fs';
import { join } from 'node:path';
import { SearchPayoutGridDto } from './dto/search-payout-grid.dto';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import * as XLSX from 'xlsx';

export interface CommissionRecord {
  lob: string;
  insurer: string;
  product: string;
  variant: string;
  rates: Record<string, number | null> & { _statewise?: Record<string, number | null> };
  remark: string;
}

export interface CommissionMeta {
  lobs: Array<{ name: string; count: number }>;
  insurers: string[];
  states: Array<{ stateId: string; stateName: string; stateCode: string }>;
  zones: Array<{ zoneId: string; zoneName: string }>;
  lastUpdated: string | null;
}

const KNOWN_META_COLUMNS = new Set(['lob', 'product', 'variant', 'remark', 'remarks']);

@Injectable()
export class PayoutGridService implements OnModuleInit {
  private readonly logger = new Logger(PayoutGridService.name);
  private records: CommissionRecord[] = [];
  private lastUpdated: string | null = null;
  private stateCodes: Set<string> = new Set();

  private readonly DATA_DIR = join(process.cwd(), 'data', 'payout-grids');
  private readonly MASTER_FILE = join(this.DATA_DIR, 'commission-master.json');

  constructor(private readonly externalApi: ExternalApiService) {}

  async onModuleInit(): Promise<void> {
    await this.loadStateCodes();
    this.loadRecords();
  }

  private async loadStateCodes(): Promise<void> {
    try {
      const states = await this.externalApi.listStates();
      this.stateCodes = new Set(states.map((s) => s.StateCode.toUpperCase()));
    } catch (err) {
      this.logger.warn('Failed to load state codes from external API', err);
    }
  }

  private loadRecords(): void {
    try {
      if (existsSync(this.MASTER_FILE)) {
        const raw = JSON.parse(readFileSync(this.MASTER_FILE, 'utf8'));
        this.records = raw.records ?? [];
        this.lastUpdated = raw.lastUpdated ?? null;
        this.logger.log(`Loaded ${this.records.length} commission records`);
      } else {
        this.logger.warn('No commission-master.json found; starting empty');
        this.records = [];
      }
    } catch (err) {
      this.logger.error('Failed to load commission records', err);
      this.records = [];
    }
  }

  getRecords(): CommissionRecord[] {
    return this.records;
  }

  getMeta(): { lobs: Array<{ name: string; count: number }>; insurers: string[]; lastUpdated: string | null } {
    const lobMap = new Map<string, number>();
    const insurerSet = new Set<string>();

    for (const r of this.records) {
      lobMap.set(r.lob, (lobMap.get(r.lob) ?? 0) + 1);
      insurerSet.add(r.insurer);
    }

    const lobs = [...lobMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const insurers = [...insurerSet].sort((a, b) => a.localeCompare(b));

    return {
      lobs,
      insurers,
      lastUpdated: this.lastUpdated,
    };
  }

  searchCommissions(filters: SearchPayoutGridDto): CommissionRecord[] {
    let results = this.records;

    if (filters.lob) {
      const needle = filters.lob.toLowerCase();
      results = results.filter((r) => r.lob.toLowerCase() === needle);
    }

    if (filters.insurer) {
      const needle = filters.insurer.toLowerCase();
      results = results.filter((r) => r.insurer.toLowerCase().includes(needle));
    }

    if (filters.state) {
      const code = filters.state.toUpperCase();
      results = results.filter((r) => {
        if (!r.rates._statewise) return true;
        return code in r.rates._statewise;
      });
    }

    if (filters.query) {
      const words = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
      results = results.filter((r) => {
        const haystack = [
          r.lob,
          r.insurer,
          r.product,
          r.variant,
          r.remark,
          ...Object.keys(r.rates).filter((k) => k !== '_statewise'),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return words.every((w) => haystack.includes(w));
      });
    }

    return results.slice(0, 500);
  }

  applyCommissionReduction(records: CommissionRecord[]): CommissionRecord[] {
    return records.map((r) => ({
      ...r,
      rates: this.reduceRates(r.rates),
    }));
  }

  private reduceRates(
    rates: Record<string, number | null> & { _statewise?: Record<string, number | null> },
  ): Record<string, number | null> & { _statewise?: Record<string, number | null> } {
    const result: Record<string, number | null> & { _statewise?: Record<string, number | null> } = {};

    for (const [key, val] of Object.entries(rates)) {
      if (key === '_statewise') {
        continue;
      }
      result[key] = typeof val === 'number' ? Math.round(val * 0.8 * 100) / 100 : (val as number | null);
    }

    if (rates._statewise) {
      result._statewise = this.reduceStatewise(rates._statewise);
    }

    return result;
  }

  private reduceStatewise(sw: Record<string, number | null>): Record<string, number | null> {
    const result: Record<string, number | null> = {};
    for (const [code, val] of Object.entries(sw)) {
      result[code] = typeof val === 'number' ? Math.round(val * 0.8 * 100) / 100 : val;
    }
    return result;
  }

  async processUploadedFile(buffer: Buffer): Promise<{ recordCount: number }> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    mkdirSync(this.DATA_DIR, { recursive: true });

    await this.loadStateCodes();

    const allRecords: CommissionRecord[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
      });
      if (rawRows.length === 0) continue;

      const { rateColumns, statewiseColumns } = this.classifyColumns(Object.keys(rawRows[0]));

      for (const raw of rawRows) {
        allRecords.push(this.parseRow(raw, sheetName, rateColumns, statewiseColumns));
      }
    }

    const data = {
      lastUpdated: new Date().toISOString(),
      records: allRecords,
    };

    writeFileSync(this.MASTER_FILE, JSON.stringify(data, null, 2));

    this.records = allRecords;
    this.lastUpdated = data.lastUpdated;
    this.logger.log(`Commission master updated: ${allRecords.length} records from ${workbook.SheetNames.length} sheets`);

    return { recordCount: allRecords.length };
  }

  private classifyColumns(columns: string[]): { rateColumns: string[]; statewiseColumns: string[] } {
    const rateColumns: string[] = [];
    const statewiseColumns: string[] = [];

    for (const col of columns) {
      const lower = col.toLowerCase();
      if (KNOWN_META_COLUMNS.has(lower)) continue;
      if (this.stateCodes.has(col.toUpperCase())) {
        statewiseColumns.push(col);
      } else {
        rateColumns.push(col);
      }
    }

    return { rateColumns, statewiseColumns };
  }

  private parseRow(
    raw: Record<string, unknown>,
    insurer: string,
    rateColumns: string[],
    statewiseColumns: string[],
  ): CommissionRecord {
    const lob = this.cellStr(raw, 'lob', 'LOB', 'Lob') || 'Motor';
    const product = this.cellStr(raw, 'product', 'Product', 'PRODUCT');
    const variant = this.cellStr(raw, 'variant', 'Variant', 'VARIANT');
    const remark = this.cellStr(raw, 'remark', 'Remark', 'remarks', 'Remarks', 'REMARK');

    const rates: Record<string, number | null> & { _statewise?: Record<string, number | null> } = {};

    for (const col of rateColumns) {
      rates[col] = this.parseNumericCell(raw[col]);
    }

    if (statewiseColumns.length > 0) {
      const sw: Record<string, number | null> = {};
      for (const col of statewiseColumns) {
        sw[col.toUpperCase()] = this.parseNumericCell(raw[col]);
      }
      rates._statewise = sw;
    }

    return { lob, insurer, product, variant, rates, remark };
  }

  private parseNumericCell(val: unknown): number | null {
    if (val === undefined || val === null || val === '') return null;
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return null;
    const s = val.trim();
    if (s === '' || s === '-' || s === '—') return null;
    const num = Number(s);
    return Number.isNaN(num) ? null : num;
  }

  private cellStr(raw: Record<string, unknown>, ...keys: string[]): string {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && v !== null && v !== '') {
        if (typeof v === 'string') return v;
        if (typeof v === 'number') return v.toString();
        return JSON.stringify(v);
      }
    }
    return '';
  }
}
