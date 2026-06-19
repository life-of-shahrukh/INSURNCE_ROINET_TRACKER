import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaModule } from '../../prisma/prisma.module';
import { PospController } from './posp.controller';
import { PospService } from './posp.service';
import { PospRepository } from './posp.repository';
import { CreatePospHandler } from './commands/create-posp.handler';
import { UpdatePospHandler } from './commands/update-posp.handler';
import { GetAllPospHandler } from './queries/get-all-posp.handler';
import { GetPospByIdHandler } from './queries/get-posp-by-id.handler';
import { ExportPospCsvHandler } from './queries/export-posp-csv.handler';
import { PospCreatedListener } from './listeners/posp-created.listener';
import { GeoModule } from '../geo/geo.module';

const CommandHandlers = [CreatePospHandler, UpdatePospHandler];
const QueryHandlers = [
  GetAllPospHandler,
  GetPospByIdHandler,
  ExportPospCsvHandler,
];
const EventListeners = [PospCreatedListener];

@Module({
  imports: [CqrsModule, PrismaModule, GeoModule],
  controllers: [PospController],
  providers: [
    PospService,
    PospRepository,
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventListeners,
  ],
})
export class PospModule {}
