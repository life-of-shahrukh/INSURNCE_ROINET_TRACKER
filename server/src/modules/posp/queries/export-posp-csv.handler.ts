import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportPospCsvQuery } from './export-posp-csv.query';
import { PospRepository } from '../posp.repository';
import { buildPospScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildPospFilterWhere } from '../posp-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import type { Prisma } from '@prisma/client';

@QueryHandler(ExportPospCsvQuery)
export class ExportPospCsvHandler implements IQueryHandler<ExportPospCsvQuery> {
  constructor(private readonly repo: PospRepository) {}

  async execute(query: ExportPospCsvQuery): Promise<string> {
    const { filters, hierarchyScope } = query;
    const scopeWhere = hierarchyScope ? buildPospScopeWhere(hierarchyScope) : {};
    const filterWhere = buildPospFilterWhere(filters);
    const where = mergeWhereClauses(scopeWhere, filterWhere) as Prisma.PospWhereInput;
    return this.repo.exportCsvWhere(where);
  }
}
