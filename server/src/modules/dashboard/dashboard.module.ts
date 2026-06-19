import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { GetDashboardStatsHandler } from './queries/get-dashboard-stats.handler';
import { GeoModule } from '../geo/geo.module';

const QueryHandlers = [GetDashboardStatsHandler];

@Module({
  imports: [CqrsModule, GeoModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, ...QueryHandlers],
})
export class DashboardModule {}
