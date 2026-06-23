import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class DeleteLeadCommand {
  constructor(
    public readonly id: string,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
