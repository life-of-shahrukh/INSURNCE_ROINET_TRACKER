import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { CustomerListQueryDto } from '../dto/customer-list-query.dto';

export class ExportCustomersCsvQuery {
  constructor(
    public readonly filters: CustomerListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
