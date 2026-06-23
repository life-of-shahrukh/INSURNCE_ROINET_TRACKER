import { UpdateDealDto } from '../dto/update-deal.dto';
import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class UpdateDealCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateDealDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
