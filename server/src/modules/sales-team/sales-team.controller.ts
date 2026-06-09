import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SalesTeamService } from './sales-team.service';
import { CreateSalesTeamDto } from './dto/create-sales-team.dto';
import { UpdateSalesTeamDto } from './dto/update-sales-team.dto';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@Controller('sales-team')
export class SalesTeamController {
  constructor(private readonly salesTeamService: SalesTeamService) {}

  // RH and above can create team members
  @Post()
  @MinRole(Role.RH)
  create(@Body() dto: CreateSalesTeamDto) {
    return this.salesTeamService.create(dto);
  }

  // All management roles can view the team list
  @Get()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN)
  findAll() {
    return this.salesTeamService.findAll();
  }

  // Hierarchy view: RH and above
  @Get('hierarchy')
  @MinRole(Role.RH)
  getHierarchy() {
    return this.salesTeamService.getHierarchy();
  }

  // Org chart nodes from Cognitensor API: RH and above
  @Get('org-chart')
  @MinRole(Role.RH)
  getOrgChart() {
    return this.salesTeamService.getOrgChartNodes();
  }

  // RH+ can update team members
  @Patch(':id')
  @MinRole(Role.RH)
  update(@Param('id') id: string, @Body() dto: UpdateSalesTeamDto) {
    return this.salesTeamService.update(id, dto);
  }

  // Only ZH and above can trigger external API sync
  @Post('sync')
  @MinRole(Role.ZH)
  syncFromApi() {
    return this.salesTeamService.syncFromExternalApi();
  }
}
