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
import { HierarchyService, type LevelRole } from './hierarchy.service';

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
      'Drill into a specific manager (by level + code) and get the next level down',
    description:
      'Returns the next-level managers (or POSPs when drilling into a DM) under the selected person, intersected with the caller scope so siblings and out-of-territory data are never exposed.',
  })
  getSubordinatesByCode(
    @Query('level') level: LevelRole,
    @Query('code') code: string,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.hierarchyService.getSubordinatesByCode(level, code, scope);
  }
}
