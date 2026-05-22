import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllPospQuery } from './get-all-posp.query';
import { PospRepository } from '../posp.repository';
import { Posp } from '@prisma/client';

@QueryHandler(GetAllPospQuery)
export class GetAllPospHandler implements IQueryHandler<GetAllPospQuery> {
  constructor(private readonly pospRepo: PospRepository) {}

  async execute(): Promise<Posp[]> {
    return this.pospRepo.findAll();
  }
}
