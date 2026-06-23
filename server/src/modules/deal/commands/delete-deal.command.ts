import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class DeleteDealCommand {
  constructor(
    public readonly id: string,
    public readonly pospId?: string,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
