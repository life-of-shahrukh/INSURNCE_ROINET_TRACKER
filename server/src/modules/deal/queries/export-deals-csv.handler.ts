import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ExportDealsCsvQuery } from './export-deals-csv.query';
import { DealRepository } from '../deal.repository';

@QueryHandler(ExportDealsCsvQuery)
export class ExportDealsCsvHandler
  implements IQueryHandler<ExportDealsCsvQuery>
{
  constructor(private readonly dealRepo: DealRepository) {}

  async execute(query: ExportDealsCsvQuery): Promise<string> {
    if (query.pospId) {
      return this.dealRepo.exportCsvByPosp(query.pospId);
    }
    return this.dealRepo.exportCsv();
  }
}
