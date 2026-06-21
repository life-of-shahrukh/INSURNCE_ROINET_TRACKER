import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrgChartService } from './org-chart.service';
import { OrgChartNode } from './org-chart.repository';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';

@ApiTags('Org Chart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org-chart')
export class OrgChartController {
  constructor(private readonly orgChartService: OrgChartService) {}

  @Get()
  @MinRole(Role.ASM)
  @ApiOperation({ summary: 'Get the full org-chart tree' })
  getTree(): Promise<OrgChartNode[]> {
    return this.orgChartService.getTree();
  }

  @Get(':id')
  @MinRole(Role.ASM)
  @ApiOperation({
    summary: 'Get org-chart subtree rooted at a specific member',
  })
  getSubtree(@Param('id') id: string): Promise<OrgChartNode> {
    return this.orgChartService.getSubtree(id);
  }
}
