import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { LeadListQueryDto } from '../dto/lead-list-query.dto';

export class GetAllLeadsQuery {
  constructor(
    public readonly filters: LeadListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
