import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { CustomerListQueryDto } from '../dto/customer-list-query.dto';

export class GetAllCustomersQuery {
  constructor(
    public readonly filters: CustomerListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
