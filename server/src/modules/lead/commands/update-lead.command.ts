import { UpdateLeadDto } from '../dto/update-lead.dto';
import type { AuthUser } from '../../../common/auth/auth-user.interface';
import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class UpdateLeadCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateLeadDto,
    public readonly user: AuthUser,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
