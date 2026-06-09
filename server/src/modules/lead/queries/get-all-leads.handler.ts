import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllLeadsQuery } from './get-all-leads.query';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';
import { buildDealScopeWhere } from '../../../common/auth/hierarchy-scope.util';

@QueryHandler(GetAllLeadsQuery)
export class GetAllLeadsHandler implements IQueryHandler<GetAllLeadsQuery> {
  constructor(private readonly repository: LeadRepository) {}

  async execute(query: GetAllLeadsQuery): Promise<Lead[]> {
    if (query.hierarchyScope) {
      const where = buildDealScopeWhere(query.hierarchyScope);
      if (Object.keys(where).length === 0) {
        return this.repository.findAll();
      }
      return this.repository.findByScope(where);
    }
    return this.repository.findAll();
  }
}
