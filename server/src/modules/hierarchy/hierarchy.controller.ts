import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { HierarchyService } from './hierarchy.service';

@ApiTags('Hierarchy')
@Controller('hierarchy')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
@ApiBearerAuth()
export class HierarchyController {
  constructor(private readonly hierarchyService: HierarchyService) {}

  @Get('filter-options')
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
      'Get scoped geo + people options for dashboard filters and scope bar',
    description:
      "Returns distinct zones, regions, areas, districts, POSPs and subordinate team members within the caller's data territory.",
  })
  getFilterOptions(
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.hierarchyService.getFilterOptions(user, scope);
  }

  @Get('subordinates')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Get direct children (SalesTeam members or POSPs) under a specific SalesTeam member',
    description:
      'Returns members (next-level managers) and posps for the given salesTeamId. Used by the cascading drill-down scope bar.',
  })
  getSubordinatesForMember(@Query('salesTeamId') salesTeamId: string) {
    return this.hierarchyService.getSubordinatesForMember(salesTeamId);
  }
}
