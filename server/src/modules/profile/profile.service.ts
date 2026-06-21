import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import {
  buildDownlineSummary,
  buildUplineSummary,
  type GeoNameResolver,
  type ProfileTeamSummary,
} from '../../common/org-graph/team-summary.util';
import { GeoCatalogService } from '../geo/geo-catalog.service';

export interface ProfileResponse {
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

  private geoResolver(): GeoNameResolver {
    return {
      districtById: (id) => {
        const d = this.geoCatalog.districtsByIds([id])[0];
        return d ? { name: d.name, stateName: d.stateName ?? null } : undefined;
      },
      cityById: (id) => {
        const c = this.geoCatalog.citiesByIds([id])[0];
        return c ? { name: c.name } : undefined;
      },
      stateById: (id) => {
        const s = this.geoCatalog
          .getCatalog()
          .states.find((st) => st.id === id);
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
      // IDE may show stale types; cast ensures fields added via raw SQL are accessible
      const posp = user.posp as Record<string, unknown> & typeof user.posp;
      response.posp = {
        id: posp.id,
        name: posp.name,
        code: posp.code,
        externalId: (posp as { externalId?: string | null }).externalId ?? null,
        gcdCode: (posp as { gcdCode?: string | null }).gcdCode ?? null,
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
        this.geoResolver(),
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
        this.geoResolver(),
      );
      if (downline) response.teamSummary = downline;
    }

    return response;
  }
}
