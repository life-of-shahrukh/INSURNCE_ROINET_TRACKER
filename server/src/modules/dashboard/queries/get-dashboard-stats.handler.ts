import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDashboardStatsQuery } from './get-dashboard-stats.query';
import { DashboardRepository } from '../dashboard.repository';
import type { DashboardStats } from '../dashboard.types';

@QueryHandler(GetDashboardStatsQuery)
export class GetDashboardStatsHandler implements IQueryHandler<GetDashboardStatsQuery> {
  constructor(private readonly repository: DashboardRepository) {}

  execute(query: GetDashboardStatsQuery): Promise<DashboardStats> {
    return this.repository.getStats(query.filters, query.scope);
  }
}
