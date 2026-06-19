import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import type {
  CognitensorResponse,
  ExternalCity,
  ExternalDistrict,
  ExternalHierarchyUser,
  ExternalPospData,
  ExternalPospLoginData,
  ExternalState,
  ExternalZone,
} from './external-api.types';

/** Alias kept for backward compat with sales-team.service */
export type HierarchyEntry = ExternalHierarchyUser;
import type { ExternalPospQueryDto } from './dto/external-posp-query.dto';
import type { ExternalHierarchyQueryDto } from './dto/external-hierarchy-query.dto';
import type { PaginatedResult } from '../interfaces/paginated-result.interface';

const SNAPSHOT_DIR = path.join(__dirname, '../../../../data/snapshots');
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
    body?: Record<string, string | number | null>,
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

  listZones(): ExternalZone[] {
    if (this.useSnapshot) return this.readSnapshot<ExternalZone>('zones.json');
    return [];
  }

  async listZonesLive(): Promise<ExternalZone[]> {
    return this.fetchLive<ExternalZone>('/Cognitensor/ListZone');
  }

  listHierarchy(query?: ExternalHierarchyQueryDto): ExternalHierarchyUser[] {
    if (this.useSnapshot) {
      let data = this.readSnapshot<ExternalHierarchyUser>('hierarchy.json');
      if (query?.districtId !== undefined) {
        data = data.filter((r) => r.DistrictId === String(query.districtId));
      }
      if (query?.userCode) {
        data = data.filter((r) => r.DistrictManagerCode === query.userCode);
      }
      if (query?.userId !== undefined) {
        data = data.filter((r) => r.DistrictManagerId === String(query.userId));
      }
      return data;
    }
    return [];
  }

  async listHierarchyLive(
    query?: ExternalHierarchyQueryDto,
  ): Promise<ExternalHierarchyUser[]> {
    // In snapshot mode there is no live endpoint to reach (e.g. local dev with
    // no UAT/VPN access). Serve the bundled snapshot so callers like the org
    // chart get real data instead of an empty live response.
    if (this.useSnapshot) {
      return this.listHierarchy(query);
    }
    const body: Record<string, string | number | null> = {
      DistrictId: query?.districtId ?? null,
      UserCode: query?.userCode ?? null,
      UserId: query?.userId ?? null,
    };
    return this.fetchLive<ExternalHierarchyUser>(
      '/Cognitensor/ListHierarchyUserData',
      body,
    );
  }

  listPosps(query: ExternalPospQueryDto): PaginatedResult<ExternalPospData> {
    const data = this.useSnapshot
      ? this.readSnapshot<ExternalPospData>('posps.json')
      : [];
    return this.filterAndPagePosps(data, query);
  }

  /** Returns every POSP from the snapshot (unpaged) — used by geography sync. */
  listAllPosps(): ExternalPospData[] {
    if (this.useSnapshot)
      return this.readSnapshot<ExternalPospData>('posps.json');
    return [];
  }

  async listPospsLive(
    query: ExternalPospQueryDto,
  ): Promise<PaginatedResult<ExternalPospData>> {
    // Pass ID-based filters directly to Cognitensor so the API does the heavy lifting.
    // Name-based filters (state/city/search) are applied client-side after the response.
    const apiBody: Record<string, string | number | null> = {
      UserId: query.userId ?? null,
      UserCode: query.userCode ?? null,
      stateid: query.stateId ? Number(query.stateId) : null,
      districtid: query.districtId ? Number(query.districtId) : null,
      cityid: query.cityId ? Number(query.cityId) : null,
    };
    const data = await this.fetchLive<ExternalPospData>(
      '/Cognitensor/ListPospData',
      apiBody,
    );
    return this.filterAndPagePosps(data, query);
  }

  /**
   * Looks up a single POSP by UserCode from the Cognitensor API.
   * Used during SSO login when isPosp=true.
   * Snapshot mode: searches posps.json by UserCode.
   * Live mode: calls ListPospData with { UserCode } filter.
   */
  async getPospByUserCode(userCode: string): Promise<ExternalPospLoginData> {
    if (this.useSnapshot) {
      const all = this.readSnapshot<ExternalPospData>('posps.json');
      const match = all.find((p) => p.UserCode === userCode);
      if (!match) {
        throw new NotFoundException(
          `POSP with UserCode "${userCode}" not found in snapshot`,
        );
      }
      return match;
    }

    const results = await this.fetchLive<ExternalPospLoginData>(
      '/Cognitensor/ListPospData',
      { UserCode: userCode },
    );

    if (!results || results.length === 0) {
      throw new NotFoundException(
        `POSP with UserCode "${userCode}" not found in Cognitensor`,
      );
    }

    return results[0];
  }

  private filterAndPagePosps(
    data: ExternalPospData[],
    query: ExternalPospQueryDto,
  ): PaginatedResult<ExternalPospData> {
    const search = query.search?.trim().toLowerCase();

    let filtered = data;

    // Exact ID / code filters
    if (query.userId) {
      filtered = filtered.filter((p) => p.UserId === query.userId);
    }
    if (query.userCode) {
      filtered = filtered.filter((p) => p.UserCode === query.userCode);
    }

    // Geography is now ID-based on the POSP record itself.
    if (query.stateId) {
      filtered = filtered.filter((p) => p.stateid === query.stateId);
    }
    if (query.districtId) {
      filtered = filtered.filter((p) => p.districtid === query.districtId);
    }
    if (query.cityId) {
      filtered = filtered.filter((p) => p.cityid === query.cityId);
    }

    // Name-based state/city filters map the name to an ID via the snapshots,
    // since POSP records no longer carry location names.
    const stateNameFilter = query.state?.trim().toLowerCase();
    if (stateNameFilter && this.useSnapshot) {
      const states = this.readSnapshot<ExternalState>('states.json');
      const match = states.find(
        (s) => s.StateName.toLowerCase() === stateNameFilter,
      );
      if (match) filtered = filtered.filter((p) => p.stateid === match.StateId);
      else filtered = [];
    }
    const cityNameFilter = query.city?.trim().toLowerCase();
    if (cityNameFilter && this.useSnapshot) {
      const cities = this.readSnapshot<ExternalCity>('cities-sample.json');
      const ids = new Set(
        cities
          .filter((c) => c.CityName.toLowerCase() === cityNameFilter)
          .map((c) => c.CityId),
      );
      filtered = filtered.filter((p) => ids.has(p.cityid));
    }

    // Free-text search across code / email / mobile / GCD code
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.UserCode.toLowerCase().includes(search) ||
          (p.username?.toLowerCase().includes(search) ?? false) ||
          p.EmailId.toLowerCase().includes(search) ||
          p.MobileNo.includes(search) ||
          p.HephGcdCode.toLowerCase().includes(search),
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
