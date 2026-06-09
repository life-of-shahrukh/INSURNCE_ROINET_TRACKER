import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

export class GetAllLeadsQuery {
  constructor(public readonly hierarchyScope?: HierarchyScope) {}
}
