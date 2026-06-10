import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportDealsCsvQuery } from './export-deals-csv.query';
import { DealRepository } from '../deal.repository';
import { buildDealScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildDealFilterWhere } from '../deal-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import type { Prisma } from '@prisma/client';

@QueryHandler(ExportDealsCsvQuery)
export class ExportDealsCsvHandler
  implements IQueryHandler<ExportDealsCsvQuery>
{
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(query: ExportDealsCsvQuery): Promise<string> {
    const { filters, hierarchyScope, pospId } = query;

    let scopeWhere: Record<string, unknown> = {};
    if (pospId && !hierarchyScope) {
      scopeWhere = { pospId };
    } else if (hierarchyScope) {
      scopeWhere = buildDealScopeWhere(hierarchyScope);
    }

    const filterWhere = buildDealFilterWhere(filters);
    const where = mergeWhereClauses(scopeWhere, filterWhere) as Prisma.DealWhereInput;

    return this.dealRepo.exportCsvWhere(where);
  }
}
