import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetPospByIdQuery } from './get-posp-by-id.query';
import { PospRepository } from '../posp.repository';
import { Posp } from '@prisma/client';

@QueryHandler(GetPospByIdQuery)
export class GetPospByIdHandler implements IQueryHandler<GetPospByIdQuery> {
  constructor(private readonly pospRepo: PospRepository) {}

  async execute(query: GetPospByIdQuery): Promise<Posp> {
    return this.pospRepo.findById(query.id);
  }
}
