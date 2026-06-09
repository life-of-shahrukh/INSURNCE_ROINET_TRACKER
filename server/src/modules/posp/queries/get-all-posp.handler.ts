import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllPospQuery } from './get-all-posp.query';
import { PospRepository } from '../posp.repository';
import { Posp } from '@prisma/client';
import { buildPospScopeWhere } from '../../../common/auth/hierarchy-scope.util';

@QueryHandler(GetAllPospQuery)
export class GetAllPospHandler implements IQueryHandler<GetAllPospQuery> {
  constructor(private readonly pospRepo: PospRepository) {}

  async execute(query: GetAllPospQuery): Promise<Posp[]> {
    if (query.hierarchyScope) {
      const where = buildPospScopeWhere(query.hierarchyScope);
      if (Object.keys(where).length === 0) {
        return this.pospRepo.findAll();
      }
      return this.pospRepo.findByScope(where);
    }
    return this.pospRepo.findAll();
  }
}
