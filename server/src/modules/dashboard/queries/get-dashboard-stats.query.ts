import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { DashboardQueryDto } from '../dto/dashboard-query.dto';

export class GetDashboardStatsQuery {
  constructor(
    public readonly filters: DashboardQueryDto,
    public readonly scope: HierarchyScope,
  ) {}
}
