import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { GetDashboardStatsHandler } from './queries/get-dashboard-stats.handler';
import { ExternalApiModule } from '../../common/external-api/external-api.module';

const QueryHandlers = [GetDashboardStatsHandler];

@Module({
  imports: [CqrsModule, ExternalApiModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, ...QueryHandlers],
})
export class DashboardModule {}
