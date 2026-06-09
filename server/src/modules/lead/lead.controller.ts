import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';

@Controller('leads')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadService.create(createLeadDto);
  }

  @Get()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  findAll(@ResolvedScope() scope: HierarchyScope) {
    return this.leadService.findAll(scope);
  }

  @Get('commitment')
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  getMonthlyCommitment() {
    return this.leadService.getMonthlyCommitment();
  }

  @Patch(':id')
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return this.leadService.update(id, updateLeadDto);
  }

  // Converting a lead to deal requires at least ASM sign-off
  @Post(':id/convert')
  @MinRole(Role.ASM)
  convertToDeal(@Param('id') id: string) {
    return this.leadService.convertToDeal(id);
  }
}
