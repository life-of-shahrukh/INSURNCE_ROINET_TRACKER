import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { DealListQueryDto } from './dto/deal-list-query.dto';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
@ApiBearerAuth()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  // Any authenticated user at DM level or above, plus POSP (own deals)
  @Get()
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  @ApiOperation({ summary: 'List deals (scoped by role, paginated)' })
  findAll(
    @Query() query: DealListQueryDto,
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.dealService.getAll(user, query, scope);
  }

  @Get('export')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  @ApiOperation({ summary: 'Export deals as CSV (respects filters)' })
  async exportCsv(
    @Query() query: DealListQueryDto,
    @Res() res: Response,
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    const csv = await this.dealService.exportCsv(user, query, scope);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
    res.send(csv);
  }

  // Only POSP field agents create new deals (own pospId enforced in service)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.POSP)
  @ApiOperation({ summary: 'Create a new deal (POSP only)' })
  create(@Body() dto: CreateDealDto, @CurrentUser() user: AuthUser) {
    return this.dealService.create(dto, user);
  }

  @Patch(':id')
  @Roles(
    Role.ASM,
    Role.DM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  @ApiOperation({ summary: 'Update a deal' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDealDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.dealService.update(id, dto, user);
  }

  // Only ASM and above can delete deals
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @MinRole(Role.ASM)
  @ApiOperation({ summary: 'Delete a deal (ASM+)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dealService.delete(id, user);
  }
}
