import type { AuthUser } from '../../../common/auth/auth-user.interface';
import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class ConvertLeadToDealCommand {
  constructor(
    public readonly leadId: string,
    public readonly user: AuthUser,
    public readonly policyNo: string,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
