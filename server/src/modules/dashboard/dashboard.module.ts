import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './dashboard.repository';
import { GetDashboardStatsHandler } from './queries/get-dashboard-stats.handler';
import { ExternalApiModule } from '../../common/external-api/external-api.module';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';

const QueryHandlers = [GetDashboardStatsHandler];

@Module({
  imports: [CqrsModule, ExternalApiModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository, HierarchyScopeInterceptor, ...QueryHandlers],
})
export class DashboardModule {}
