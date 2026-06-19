import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SalesTeamService } from './sales-team.service';
import { CreateSalesTeamDto } from './dto/create-sales-team.dto';
import { UpdateSalesTeamDto } from './dto/update-sales-team.dto';
import { SalesTeamListQueryDto } from './dto/sales-team-list-query.dto';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@Controller('sales-team')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  findAll(@Query() query: SalesTeamListQueryDto) {
    return this.salesTeamService.findAll(query);
  }

  @Get('export')
  @MinRole(Role.DM)
  async exportCsv(@Query() query: SalesTeamListQueryDto, @Res() res: Response) {
    const csv = await this.salesTeamService.exportCsv(query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sales-team.csv"',
    );
    res.send(csv);
  }

  // Hierarchy view: RH and above
  @Get('hierarchy')
  @MinRole(Role.RH)
  getHierarchy() {
    return this.salesTeamService.getHierarchy();
  }

  // Org chart nodes from the persisted org graph (synced weekly): RH and above
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
