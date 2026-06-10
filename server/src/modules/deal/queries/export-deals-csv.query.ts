import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { DealListQueryDto } from '../dto/deal-list-query.dto';

export class ExportDealsCsvQuery {
  constructor(
    public readonly filters: DealListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
    public readonly pospId?: string,
  ) {}
}
