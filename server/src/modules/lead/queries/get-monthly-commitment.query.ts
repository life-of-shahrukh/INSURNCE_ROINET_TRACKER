import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class GetMonthlyCommitmentQuery {
  constructor(public readonly hierarchyScope?: HierarchyScope) {}
}
