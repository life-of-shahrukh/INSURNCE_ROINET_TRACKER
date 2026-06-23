import { UpdateCustomerDto } from '../dto/update-customer.dto';
import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';

export class UpdateCustomerCommand {
  constructor(
    public readonly id: string,
    public readonly dto: UpdateCustomerDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
