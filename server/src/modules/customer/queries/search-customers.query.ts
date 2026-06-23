import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class SearchCustomersQuery {
  constructor(
    public readonly query: string,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
