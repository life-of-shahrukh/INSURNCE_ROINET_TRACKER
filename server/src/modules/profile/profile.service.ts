import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import {
  buildDownlineSummary,
  buildUplineSummary,
  type GeoNameResolver,
  type ProfileTeamSummary,
} from '../../common/org-graph/team-summary.util';
import { enrichPospsWithActivity } from '../../common/business-rules/posp-activity.prisma';
import {
  buildPospScopeWhere,
  districtIdsForCode,
  resolveHierarchyScope,
  scopeDistrictIds,
} from '../../common/auth/hierarchy-scope.util';
import { GeoCatalogService } from '../geo/geo-catalog.service';

export interface ProfileResponse {
  userCode?: string;
  user: {
    id: string;
    email: string;
    role: string;
    status: string;
  };
  posp?: {
    id: string;
    name: string;
    code: string;
    externalId: string | null;
    gcdCode: string | null;
    mobile: string;
    email: string;
    joined: Date;
    active: boolean;
    region: string | null;
    zoneId: string | null;
    regionId: string | null;
    areaId: string | null;
    districtId: string | null;
  };
  salesTeam?: {
    id: string;
    name: string;
    employeeCode: string;
    designation: string;
    mobile: string;
    email: string;
    joiningDate: Date;
    status: string;
    zoneId: string | null;
    zoneName: string | null;
    regionId: string | null;
    regionName: string | null;
    areaId: string | null;
    areaName: string | null;
    managerId: string | null;
    territory: string | null;
  };
  teamSummary?: ProfileTeamSummary;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoCatalog: GeoCatalogService,
  ) {}

  private async geoResolver(): Promise<GeoNameResolver> {
    // Pre-fetch all geo data once so the resolver methods stay synchronous
    // (matching the GeoNameResolver interface signature).
    const [catalog, districts, cities] = await Promise.all([
      this.geoCatalog.getCatalog(),
      this.geoCatalog.searchDistricts('', 10000),
      this.geoCatalog.searchCities('', 10000),
    ]);
    const districtMap = new Map(districts.map((d) => [d.id, d]));
    const cityMap = new Map(cities.map((c) => [c.id, c]));
    const stateMap = new Map(catalog.states.map((s) => [s.id, s]));

    return {
      districtById: (id) => {
        const d = districtMap.get(id);
        return d ? { name: d.name, stateName: d.stateName ?? null } : undefined;
      },
      cityById: (id) => {
        const c = cityMap.get(id);
        return c ? { name: c.name } : undefined;
      },
      stateById: (id) => {
        const s = stateMap.get(id);
        return s ? { name: s.name } : undefined;
      },
    };
  }

  async getProfile(userId: string): Promise<ProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        posp: true,
        salesTeam: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const response: ProfileResponse = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    };

    if (user.posp) {
      const [enriched] = await enrichPospsWithActivity(this.prisma, [
        user.posp,
      ]);
      const posp = enriched;
      response.posp = {
        id: posp.id,
        name: posp.name,
        code: posp.code,
        externalId:
          (user.posp as { externalId?: string | null }).externalId ?? null,
        gcdCode: (user.posp as { gcdCode?: string | null }).gcdCode ?? null,
        mobile: posp.mobile,
        email: posp.email,
        joined: posp.joined,
        active: posp.active,
        region: posp.region,
        zoneId: posp.zoneId,
        regionId: posp.regionId,
        areaId: posp.areaId,
        districtId: posp.districtId,
      };
    }

    if (user.salesTeam) {
      response.salesTeam = {
        id: user.salesTeam.id,
        name: user.salesTeam.name,
        employeeCode: user.salesTeam.employeeCode,
        designation: user.salesTeam.designation,
        mobile: user.salesTeam.mobile,
        email: user.salesTeam.email,
        joiningDate: user.salesTeam.joiningDate,
        status: user.salesTeam.status,
        zoneId: user.salesTeam.zoneId,
        zoneName: user.salesTeam.zoneName,
        regionId: user.salesTeam.regionId,
        regionName: user.salesTeam.regionName,
        areaId: user.salesTeam.areaId,
        areaName: user.salesTeam.areaName,
        managerId: user.salesTeam.managerId,
        territory: user.salesTeam.territory,
      };
    }

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      role: user.role as AuthUser['role'],
      status: user.status as AuthUser['status'],
      pospId: user.pospId ?? undefined,
    };

    if (user.posp) {
      const upline = await buildUplineSummary(
        this.prisma,
        user.posp,
        await this.geoResolver(),
      );
      if (upline) response.teamSummary = upline;
    } else if (
      user.salesTeam ||
      user.role === Role.SUPER_ADMIN ||
      user.role === Role.NATIONAL_HEAD
    ) {
      const downline = await buildDownlineSummary(
        this.prisma,
        authUser,
        await this.geoResolver(),
      );
      if (downline) response.teamSummary = downline;
    }

    return response;
  }

  /**
   * Resolve a CRM user id from a Cognitensor userCode (Posp.code or
   * SalesTeam.employeeCode). Designed for reuse across POSP roster, sales team,
   * and future role-specific profile lookups.
   */
  async resolveUserIdByUserCode(userCode: string): Promise<string> {
    const code = userCode.trim();
    if (!code) {
      throw new BadRequestException('userCode is required');
    }

    const posp = await this.prisma.posp.findUnique({
      where: { code },
      select: { user: { select: { id: true } } },
    });
    if (posp?.user) return posp.user.id;

    const salesTeam = await this.prisma.salesTeam.findUnique({
      where: { employeeCode: code },
      select: { user: { select: { id: true } } },
    });
    if (salesTeam?.user) return salesTeam.user.id;

    throw new NotFoundException(`No CRM profile linked to userCode "${code}"`);
  }

  private async assertCallerCanViewProfile(
    caller: AuthUser,
    targetUserId: string,
  ): Promise<void> {
    if (caller.userId === targetUserId) return;

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { posp: true, salesTeam: true },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const scope = await resolveHierarchyScope(caller, this.prisma);
    if (!scope || Object.keys(scope).length === 0) return;

    if (scope.pospIds !== undefined) {
      throw new ForbiddenException('You cannot view other user profiles');
    }

    if (target.posp) {
      const where = buildPospScopeWhere(scope);
      const allowed = await this.prisma.posp.count({
        where: { id: target.posp.id, ...where },
      });
      if (allowed === 0) {
        throw new ForbiddenException('This profile is outside your territory');
      }
      return;
    }

    if (target.salesTeam) {
      const targetDistricts = await districtIdsForCode(
        this.prisma,
        target.salesTeam.employeeCode,
      );
      const callerDistricts = scopeDistrictIds(scope);
      if (callerDistricts === null) return;
      const overlap = targetDistricts.some((d) => callerDistricts.includes(d));
      if (!overlap) {
        throw new ForbiddenException('This profile is outside your territory');
      }
      return;
    }

    throw new ForbiddenException('You cannot view this profile');
  }

  async getProfileByUserCode(
    userCode: string,
    caller: AuthUser,
  ): Promise<ProfileResponse> {
    const code = userCode.trim();
    const userId = await this.resolveUserIdByUserCode(code);
    await this.assertCallerCanViewProfile(caller, userId);
    const profile = await this.getProfile(userId);
    return { ...profile, userCode: code };
  }
}
