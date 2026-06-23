import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMonthlyCommitmentQuery } from './get-monthly-commitment.query';
import { LeadRepository } from '../lead.repository';
import { buildLeadScopeWhere } from '../../../common/auth/hierarchy-scope.util';
import type { Prisma } from '@prisma/client';

@QueryHandler(GetMonthlyCommitmentQuery)
export class GetMonthlyCommitmentHandler implements IQueryHandler<GetMonthlyCommitmentQuery> {
  constructor(private readonly repository: LeadRepository) {}

  async execute(
    query: GetMonthlyCommitmentQuery,
  ): Promise<{ total: number; count: number }> {
    const scopeWhere = query.hierarchyScope
      ? (buildLeadScopeWhere(query.hierarchyScope) as Prisma.LeadWhereInput)
      : {};

    return this.repository.getMonthlyCommitment(scopeWhere);
  }
}
