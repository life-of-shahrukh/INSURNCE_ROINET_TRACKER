import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetAllLeadsQuery } from './get-all-leads.query';
import { LeadRepository } from '../lead.repository';
import { Lead } from '@prisma/client';

@QueryHandler(GetAllLeadsQuery)
export class GetAllLeadsHandler implements IQueryHandler<GetAllLeadsQuery> {
  constructor(private readonly repository: LeadRepository) {}

  async execute(): Promise<Lead[]> {
    return this.repository.findAll();
  }
}
