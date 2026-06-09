import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

export class GetAllDealsQuery {
  constructor(
    public readonly pospId?: string,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
