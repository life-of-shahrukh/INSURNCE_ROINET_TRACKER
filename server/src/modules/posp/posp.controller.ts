import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PospService } from './posp.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { PospListQueryDto } from './dto/posp-list-query.dto';

@ApiTags('POSP')
@Controller('posp')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
@ApiBearerAuth()
export class PospController {
  constructor(private readonly pospService: PospService) {}

  // DM and above can list POSPs; POSP can see own profile
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
  @ApiOperation({ summary: 'List POSPs (scoped by role)' })
  findAll(
    @Query() query: PospListQueryDto,
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.pospService.getAll(user, query, scope);
  }

  @Get('export')
  @MinRole(Role.DM)
  @ApiOperation({ summary: 'Export POSPs as CSV (scoped)' })
  async exportCsv(
    @Query() query: PospListQueryDto,
    @Res() res: Response,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    const csv = await this.pospService.exportCsv(query, scope);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="posp.csv"');
    res.send(csv);
  }

  // Only ASM and above can create/register POSPs
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @MinRole(Role.ASM)
  @ApiOperation({ summary: 'Register a new POSP (ASM+)' })
  create(@Body() dto: CreatePospDto, @CurrentUser() user: AuthUser) {
    return this.pospService.create(dto, user);
  }

  // ASM+ or POSP editing own profile
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
  @ApiOperation({ summary: 'Update a POSP' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePospDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pospService.update(id, dto, user);
  }
}
