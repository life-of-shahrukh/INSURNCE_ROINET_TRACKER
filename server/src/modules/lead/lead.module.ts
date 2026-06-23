import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { LeadRepository } from './lead.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreateLeadHandler } from './commands/create-lead.handler';
import { UpdateLeadHandler } from './commands/update-lead.handler';
import { ConvertLeadToDealHandler } from './commands/convert-lead-to-deal.handler';
import { DeleteLeadHandler } from './commands/delete-lead.handler';
import { GetAllLeadsHandler } from './queries/get-all-leads.handler';
import { GetMonthlyCommitmentHandler } from './queries/get-monthly-commitment.handler';
import { ExportLeadsCsvHandler } from './queries/export-leads-csv.handler';
import { LeadEventsListener } from './listeners/lead-events.listener';
import { GeoModule } from '../geo/geo.module';

const CommandHandlers = [
  CreateLeadHandler,
  UpdateLeadHandler,
  ConvertLeadToDealHandler,
  DeleteLeadHandler,
];
const QueryHandlers = [
  GetAllLeadsHandler,
  GetMonthlyCommitmentHandler,
  ExportLeadsCsvHandler,
];
const EventListeners = [LeadEventsListener];

@Module({
  imports: [CqrsModule, PrismaModule, GeoModule],
  controllers: [LeadController],
  providers: [
    LeadService,
    LeadRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,
  ],
  exports: [LeadService, LeadRepository],
})
export class LeadModule {}
