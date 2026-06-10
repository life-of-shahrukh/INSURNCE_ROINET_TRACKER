import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetMonthlyCommitmentQuery } from './get-monthly-commitment.query';
import { LeadRepository } from '../lead.repository';

@QueryHandler(GetMonthlyCommitmentQuery)
export class GetMonthlyCommitmentHandler implements IQueryHandler<GetMonthlyCommitmentQuery> {
  constructor(private readonly repository: LeadRepository) {}

  async execute(): Promise<{ total: number; count: number }> {
    return this.repository.getMonthlyCommitment();
  }
}
