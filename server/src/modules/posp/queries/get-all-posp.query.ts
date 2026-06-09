import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';

export class GetAllPospQuery {
  constructor(public readonly hierarchyScope?: HierarchyScope) {}
}
