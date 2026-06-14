import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportLeadsCsvQuery } from './export-leads-csv.query';
import { LeadRepository } from '../lead.repository';
import { buildLeadScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import { buildLeadFilterWhere } from '../lead-filter.util';
import { mergeWhereClauses } from '../../../common/utils/filter.util';
import type { Prisma } from '@prisma/client';

@QueryHandler(ExportLeadsCsvQuery)
export class ExportLeadsCsvHandler implements IQueryHandler<ExportLeadsCsvQuery> {
  constructor(private readonly repo: LeadRepository) {}

  async execute(query: ExportLeadsCsvQuery): Promise<string> {
    const { filters, hierarchyScope } = query;
    const scopeWhere = hierarchyScope
      ? buildLeadScopeWhere(hierarchyScope)
      : {};
    const filterWhere = buildLeadFilterWhere(filters);
    const where = mergeWhereClauses(
      scopeWhere,
      filterWhere,
    ) as Prisma.LeadWhereInput;
    return this.repo.exportCsvWhere(where);
  }
}
