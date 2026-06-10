import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type {
  CognitensorResponse,
  ExternalCity,
  ExternalDistrict,
  ExternalHierarchyUser,
  ExternalPospData,
  ExternalState,
} from './external-api.types';

/** Alias kept for backward compat with sales-team.service */
export type HierarchyEntry = ExternalHierarchyUser;
import type { ExternalPospQueryDto } from './dto/external-posp-query.dto';
import type { PaginatedResult } from '../interfaces/paginated-result.interface';

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const COGNITENSOR_BASE = 'https://uatserviceapi.roinet.in';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger(ExternalApiService.name);
  private readonly useSnapshot: boolean;

  constructor(private readonly config: ConfigService) {
    this.useSnapshot =
      this.config.get<string>('USE_EXTERNAL_API_SNAPSHOT', 'true') !== 'false';
    this.logger.log(
      `External API mode: ${this.useSnapshot ? 'SNAPSHOT' : 'LIVE'}`,
    );
  }

  // ── snapshot helpers ────────────────────────────────────────────────────

  private readSnapshot<T>(filename: string): T[] {
    const filePath = path.join(SNAPSHOT_DIR, filename);
    const raw = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw) as CognitensorResponse<T>;
    return parsed.Data;
  }

  // ── live API helpers ────────────────────────────────────────────────────

  private async fetchLive<T>(
    endpoint: string,
    body?: Record<string, string>,
  ): Promise<T[]> {
    const res = await fetch(`${COGNITENSOR_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : '',
    });
    if (!res.ok) {
      throw new Error(`Cognitensor API error: ${res.status} ${res.statusText}`);
    }
    const wrapper = (await res.json()) as CognitensorResponse<T>;
    return wrapper.Data;
  }

  // ── public methods ──────────────────────────────────────────────────────

  listStates(): ExternalState[] {
    if (this.useSnapshot)
      return this.readSnapshot<ExternalState>('states.json');
    return [];
  }

  async listStatesLive(): Promise<ExternalState[]> {
    return this.fetchLive<ExternalState>('/Cognitensor/ListState');
  }

  listDistricts(stateId: string): ExternalDistrict[] {
    if (this.useSnapshot) {
      const all = this.readSnapshot<ExternalDistrict>('districts-sample.json');
      return stateId ? all.filter((d) => d.StateId === stateId) : all;
    }
    return [];
  }

  async listDistrictsLive(stateId: string): Promise<ExternalDistrict[]> {
    return this.fetchLive<ExternalDistrict>('/Cognitensor/ListDistrict', {
      stateid: stateId,
    });
  }

  listCities(districtId: string): ExternalCity[] {
    if (this.useSnapshot) {
      const all = this.readSnapshot<ExternalCity>('cities-sample.json');
      return districtId ? all.filter((c) => c.DistrictId === districtId) : all;
    }
    return [];
  }

  async listCitiesLive(districtId: string): Promise<ExternalCity[]> {
    return this.fetchLive<ExternalCity>('/Cognitensor/ListCity', {
      districtid: districtId,
    });
  }

  listHierarchy(): ExternalHierarchyUser[] {
    if (this.useSnapshot)
      return this.readSnapshot<ExternalHierarchyUser>('hierarchy.json');
    return [];
  }

  async listHierarchyLive(): Promise<ExternalHierarchyUser[]> {
    return this.fetchLive<ExternalHierarchyUser>(
      '/Cognitensor/ListHierarchyUserData',
    );
  }

  listPosps(query: ExternalPospQueryDto): PaginatedResult<ExternalPospData> {
    const data = this.useSnapshot
      ? this.readSnapshot<ExternalPospData>('posps.json')
      : [];
    return this.filterAndPagePosps(data, query);
  }

  async listPospsLive(
    query: ExternalPospQueryDto,
  ): Promise<PaginatedResult<ExternalPospData>> {
    const data = await this.fetchLive<ExternalPospData>(
      '/Cognitensor/ListPospData',
    );
    return this.filterAndPagePosps(data, query);
  }

  private filterAndPagePosps(
    data: ExternalPospData[],
    query: ExternalPospQueryDto,
  ): PaginatedResult<ExternalPospData> {
    const search = query.search?.trim().toLowerCase();
    const stateFilter = query.state?.trim().toLowerCase();
    const cityFilter = query.city?.trim().toLowerCase();

    let filtered = data;
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.UserCode.toLowerCase().includes(search) ||
          p.EmailId.toLowerCase().includes(search) ||
          p.MobileNo.includes(search) ||
          p.ResidenceCity.toLowerCase().includes(search) ||
          p.HephGcdCode.toLowerCase().includes(search),
      );
    }
    if (stateFilter) {
      filtered = filtered.filter((p) =>
        p.ResidenceState.toLowerCase().includes(stateFilter),
      );
    }
    if (cityFilter) {
      filtered = filtered.filter((p) =>
        p.ResidenceCity.toLowerCase().includes(cityFilter),
      );
    }

    const total = filtered.length;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    return {
      data: filtered.slice(skip, skip + pageSize),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }
}
