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
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { LeadListQueryDto } from './dto/lead-list-query.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

class ConvertLeadBodyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  policyNo: string;
}

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @Roles(Role.POSP)
  create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: AuthUser) {
    return this.leadService.create(createLeadDto, user);
  }

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
  findAll(
    @Query() query: LeadListQueryDto,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.leadService.findAll(query, scope);
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
  async exportCsv(
    @Query() query: LeadListQueryDto,
    @Res() res: Response,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    const csv = await this.leadService.exportCsv(query, scope);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leads.csv"');
    res.send(csv);
  }

  @Get('commitment')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  getMonthlyCommitment() {
    return this.leadService.getMonthlyCommitment();
  }

  @Patch(':id')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.leadService.update(id, updateLeadDto, user, scope);
  }

  @Post(':id/convert')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  convertToDeal(
    @Param('id') id: string,
    @Body() body: ConvertLeadBodyDto,
    @CurrentUser() user: AuthUser,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.leadService.convertToDeal(id, user, body.policyNo, scope);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  remove(@Param('id') id: string, @ResolvedScope() scope: HierarchyScope) {
    return this.leadService.delete(id, scope);
  }
}
