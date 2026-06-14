import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import type { DashboardStats } from './dashboard.types';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Aggregated dashboard KPIs and chart data (scoped by role and date range)',
  })
  async getStats(
    @Query() query: DashboardQueryDto,
    @ResolvedScope() scope: HierarchyScope,
    @CurrentUser() user: AuthUser,
  ): Promise<DashboardStats> {
    const stats = await this.dashboardService.getStats(query, scope);

    // Financial fields (COA / margin / cost-per-issued) are SUPER_ADMIN-only.
    // Strip them for every other role so they never reach the client payload.
    if (user.role !== Role.SUPER_ADMIN) {
      stats.deals.totalMargin = null;
      stats.deals.totalCoa = null;
      stats.deals.costPerIssuedPolicy = null;
    }

    return stats;
  }
}
