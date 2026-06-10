import { Injectable } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import type { DashboardQueryDto } from './dto/dashboard-query.dto';
import { GetDashboardStatsQuery } from './queries/get-dashboard-stats.query';
import type { DashboardStats } from './dashboard.types';

@Injectable()
export class DashboardService {
  constructor(private readonly queryBus: QueryBus) {}

  getStats(
    filters: DashboardQueryDto,
    scope: HierarchyScope,
  ): Promise<DashboardStats> {
    return this.queryBus.execute(new GetDashboardStatsQuery(filters, scope));
  }
}
