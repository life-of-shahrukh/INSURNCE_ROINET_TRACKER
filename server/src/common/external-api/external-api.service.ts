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
  ManagerIdentity,
} from './external-api.types';
import {
  externalUserTypeToRole,
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

  listZones(): ExternalZone[] {
    if (this.useSnapshot) {
      const zonePath = path.join(SNAPSHOT_DIR, 'zones.json');
      if (fs.existsSync(zonePath)) {
        return this.readSnapshot<ExternalZone>('zones.json');
      }
      return [];
    }
    return [];
  }

  async listZonesLive(): Promise<ExternalZone[]> {
    return this.fetchLive<ExternalZone>('/Cognitensor/ListZone');
  }

  listDistricts(stateId: string): ExternalDistrict[] {
    if (this.useSnapshot) {
      const all = this.readSnapshot<ExternalDistrict>('districts.json');
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

  listHierarchy(query?: ExternalHierarchyQueryDto): ExternalHierarchyUser[] {
    if (this.useSnapshot) {
      let data = this.readSnapshot<ExternalHierarchyUser>('hierarchy.json');
      if (query?.districtId !== undefined) {
        data = data.filter((r) => r.DistrictId === String(query.districtId));
      }
      if (query?.userCode) {
        const code = query.userCode;
        data = data.filter((r) => {
          if (r.DistrictManagerCode === code) return true;
          for (let i = 1; i <= 7; i++) {
            if ((r as Record<string, string>)[`R${i}_UserCode`] === code) return true;
          }
          return false;
        });
      }
      if (query?.userId !== undefined) {
        const uid = String(query.userId);
        data = data.filter((r) => {
          if (r.DistrictManagerId === uid) return true;
          for (let i = 1; i <= 7; i++) {
            if ((r as Record<string, string>)[`R${i}_UserId`] === uid) return true;
          }
          return false;
        });
      }
      return data;
    }
    return [];
  }

  async listHierarchyLive(
    query?: ExternalHierarchyQueryDto,
  ): Promise<ExternalHierarchyUser[]> {
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

  /**
   * Resolves a manager's identity (role, districtIds) by querying
   * ListHierarchyUserData with their userCode as a direct filter.
   * The API returns only records where this manager appears anywhere
   * in the hierarchy chain — no full scan needed.
   *
   * Snapshot mode searches across all R-level columns.
   * Live mode relies on the Cognitensor API's server-side filter.
   */
  async getManagerIdentity(userCode: string): Promise<ManagerIdentity> {
    const rows = await (this.useSnapshot
      ? Promise.resolve(this.listHierarchy({ userCode }))
      : this.listHierarchyLive({ userCode }));

    if (!rows || rows.length === 0) {
      throw new NotFoundException(
        `No hierarchy records found for userCode "${userCode}"`,
      );
    }

    // Find which position this user holds (DM / R1..R7) and their usertype
    const first = rows[0];
    let userId = '';
    let userName = '';
    let usertypeStr = '';

    if (first.DistrictManagerCode === userCode) {
      userId = first.DistrictManagerId;
      userName = first.DistrictManagerName;
      usertypeStr = first.usertype ?? '12';
    } else {
      // Search R1–R7 for the matching code
      let found = false;
      for (let i = 1; i <= 7; i++) {
        const row = first as Record<string, string>;
        if (row[`R${i}_UserCode`] === userCode) {
          userId = row[`R${i}_UserId`] ?? '';
          userName = row[`R${i}_UserName`] ?? '';
          usertypeStr = row[`R${i}_usertype`] ?? '';
          found = true;
          break;
        }
      }
      if (!found) {
        // Fallback: use the district manager level
        userId = first.DistrictManagerId;
        userName = first.DistrictManagerName;
        usertypeStr = first.usertype ?? '12';
      }
    }

    const usertypeNum = parseInt(usertypeStr, 10);
    const role = externalUserTypeToRole(usertypeNum);
    if (!role) {
      throw new NotFoundException(
        `UserCode "${userCode}" has unhandled usertype ${usertypeNum} — not a loginable manager role`,
      );
    }

    const districtIds = rows.map((r) => r.DistrictId).filter(Boolean);

    return {
      userId,
      userCode,
      userName,
      usertype: usertypeNum,
      role,
      districtIds,
    };
  }

  /**
   * Returns live POSP profiles for a given districtId.
   * Used by dashboard for POSP roster views within a manager's territory.
   * Dashboard metrics (deals, leads) are from local DB; profiles come from here.
   */
  listPospsByDistrict(districtId: string): ExternalPospData[] {
    if (this.useSnapshot) {
      const all = this.readSnapshot<ExternalPospData>('posps.json');
      return districtId
        ? all.filter((p) => p.districtid === districtId)
        : all;
    }
    return [];
  }

  async listPospsByDistrictLive(districtId: string): Promise<ExternalPospData[]> {
    return this.fetchLive<ExternalPospData>('/Cognitensor/ListPospData', {
      districtid: Number(districtId),
    });
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

    // Free-text search across name / code / email / mobile / GCD code
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.UserCode.toLowerCase().includes(search) ||
          p.EmailId.toLowerCase().includes(search) ||
          p.MobileNo.includes(search) ||
          p.HephGcdCode.toLowerCase().includes(search) ||
          (p.username ?? '').toLowerCase().includes(search),
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
