import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllDealsQuery } from './get-all-deals.query';
import { DealRepository } from '../deal.repository';
import { Deal } from '@prisma/client';
import { buildDealScopeWhere } from '../../../common/auth/hierarchy-scope.util';

@QueryHandler(GetAllDealsQuery)
export class GetAllDealsHandler implements IQueryHandler<GetAllDealsQuery> {
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(query: GetAllDealsQuery): Promise<Deal[]> {
    const scope = query.hierarchyScope;

    // Legacy POSP-only path (backwards compat — pospId set directly)
    if (query.pospId && !scope) {
      return this.dealRepo.findAllByPospId(query.pospId);
    }

    // Scope-aware path
    if (scope) {
      const where = buildDealScopeWhere(scope);
      if (Object.keys(where).length === 0) {
        return this.dealRepo.findAll(); // SUPER_ADMIN / NATIONAL_HEAD
      }
      return this.dealRepo.findByScope(where);
    }

    return this.dealRepo.findAll();
  }
}
