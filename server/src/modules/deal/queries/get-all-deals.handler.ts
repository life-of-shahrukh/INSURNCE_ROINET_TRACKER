import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllDealsQuery } from './get-all-deals.query';
import { DealRepository } from '../deal.repository';
import { Deal } from '@prisma/client';

@QueryHandler(GetAllDealsQuery)
export class GetAllDealsHandler implements IQueryHandler<GetAllDealsQuery> {
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(): Promise<Deal[]> {
    return this.dealRepo.findAll();
  }
}
