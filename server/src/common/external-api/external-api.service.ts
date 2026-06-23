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

  /**
   * When true the service skips the live API entirely and always uses
   * snapshots (useful for CI / offline environments).
   * Default: false — live is tried first and snapshots are the fallback.
   */
  private readonly snapshotOnly: boolean;

  constructor(private readonly config: ConfigService) {
    this.snapshotOnly =
      this.config.get<string>('USE_EXTERNAL_API_SNAPSHOT', 'false') === 'true';
    this.logger.log(
      `External API mode: ${this.snapshotOnly ? 'SNAPSHOT-ONLY' : 'LIVE (snapshot fallback)'}`,
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

  /**
   * Tries the live Cognitensor API first. If it fails (network error, non-2xx,
   * timeout) logs a warning and falls back to the local snapshot file.
   * If snapshotOnly=true the live call is skipped entirely.
   */
  private async fetchWithFallback<T>(
    endpoint: string,
    snapshotFile: string,
    body?: Record<string, string | number | null>,
  ): Promise<T[]> {
    if (!this.snapshotOnly) {
      try {
        const data = await this.fetchLive<T>(endpoint, body);
        return data;
      } catch (err) {
        this.logger.warn(
          `Live API call to ${endpoint} failed — falling back to snapshot "${snapshotFile}". Reason: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    return this.readSnapshot<T>(snapshotFile);
  }

  // ── public methods ──────────────────────────────────────────────────────

  async listStates(): Promise<ExternalState[]> {
    return this.fetchWithFallback<ExternalState>(
      '/Cognitensor/ListState',
      'states.json',
    );
  }

  async listDistricts(stateId: string): Promise<ExternalDistrict[]> {
    const all = await this.fetchWithFallback<ExternalDistrict>(
      '/Cognitensor/ListDistrict',
      'districts-sample.json',
      { stateid: stateId },
    );
    return stateId ? all.filter((d) => d.StateId === stateId) : all;
  }

  async listCities(districtId: string): Promise<ExternalCity[]> {
    const all = await this.fetchWithFallback<ExternalCity>(
      '/Cognitensor/ListCity',
      'cities-sample.json',
      { districtid: districtId },
    );
    return districtId ? all.filter((c) => c.DistrictId === districtId) : all;
  }

  async listZones(): Promise<ExternalZone[]> {
    return this.fetchWithFallback<ExternalZone>(
      '/Cognitensor/ListZone',
      'zones.json',
    );
  }

  async listHierarchy(
    query?: ExternalHierarchyQueryDto,
  ): Promise<ExternalHierarchyUser[]> {
    const body: Record<string, string | number | null> = {
      DistrictId: query?.districtId ?? null,
      UserCode: query?.userCode ?? null,
      UserId: query?.userId ?? null,
    };
    let data = await this.fetchWithFallback<ExternalHierarchyUser>(
      '/Cognitensor/ListHierarchyUserData',
      'hierarchy.json',
      body,
    );
    // Apply client-side filters for snapshot results (live API filters server-side)
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

  /** @deprecated Use listHierarchy() — now always tries live first. */
  async listHierarchyLive(
    query?: ExternalHierarchyQueryDto,
  ): Promise<ExternalHierarchyUser[]> {
    return this.listHierarchy(query);
  }

  async listPosps(
    query: ExternalPospQueryDto,
  ): Promise<PaginatedResult<ExternalPospData>> {
    const data = await this.fetchWithFallback<ExternalPospData>(
      '/Cognitensor/ListPospData',
      'posps.json',
      {
        UserId: query.userId ?? null,
        UserCode: query.userCode ?? null,
        stateid: query.stateId ? Number(query.stateId) : null,
        districtid: query.districtId ? Number(query.districtId) : null,
        cityid: query.cityId ? Number(query.cityId) : null,
      },
    );
    return this.filterAndPagePosps(data, query);
  }

  /** @deprecated Use listPosps() — now always tries live first. */
  async listPospsLive(
    query: ExternalPospQueryDto,
  ): Promise<PaginatedResult<ExternalPospData>> {
    return this.listPosps(query);
  }

  /** Returns every POSP (unpaged) — used by geography sync. */
  async listAllPosps(): Promise<ExternalPospData[]> {
    return this.fetchWithFallback<ExternalPospData>(
      '/Cognitensor/ListPospData',
      'posps.json',
    );
  }

  /**
   * Looks up a single POSP by UserCode.
   * Tries the live Cognitensor API first; falls back to the snapshot on failure.
   */
  async getPospByUserCode(userCode: string): Promise<ExternalPospLoginData> {
    let results: ExternalPospLoginData[] = [];

    if (!this.snapshotOnly) {
      try {
        results = await this.fetchLive<ExternalPospLoginData>(
          '/Cognitensor/ListPospData',
          { UserCode: userCode },
        );
      } catch (err) {
        this.logger.warn(
          `Live lookup for POSP "${userCode}" failed — falling back to snapshot. Reason: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    if (!results || results.length === 0) {
      // Fallback: search the snapshot
      const all = this.readSnapshot<ExternalPospData>('posps.json');
      const match = all.find((p) => p.UserCode === userCode);
      if (!match) {
        throw new NotFoundException(
          `POSP with UserCode "${userCode}" not found`,
        );
      }
      return match;
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

    // Name-based state/city filters — resolve name → ID via snapshot lookup
    const stateNameFilter = query.state?.trim().toLowerCase();
    if (stateNameFilter) {
      const states = this.readSnapshot<ExternalState>('states.json');
      const match = states.find(
        (s) => s.StateName.toLowerCase() === stateNameFilter,
      );
      if (match) filtered = filtered.filter((p) => p.stateid === match.StateId);
      else filtered = [];
    }
    const cityNameFilter = query.city?.trim().toLowerCase();
    if (cityNameFilter) {
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
