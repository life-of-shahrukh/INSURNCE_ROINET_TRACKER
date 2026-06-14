import type { HierarchyScope } from '../../../common/auth/hierarchy-scope.util';
import type { PospListQueryDto } from '../dto/posp-list-query.dto';

export class ExportPospCsvQuery {
  constructor(
    public readonly filters: PospListQueryDto,
    public readonly hierarchyScope?: HierarchyScope,
  ) {}
}
