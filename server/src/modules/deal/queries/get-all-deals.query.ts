import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { DealListQueryDto } from '../dto/deal-list-query.dto';

export class GetAllDealsQuery {
  constructor(
    public readonly filters: DealListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
    /** @deprecated use hierarchyScope */
    public readonly pospId?: string,
  ) {}
}
