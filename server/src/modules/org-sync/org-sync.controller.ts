import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { OrgSyncService } from './org-sync.service';
import type { OrgGraphCounts } from '../../common/org-graph/org-graph.repository';

@Controller('org-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrgSyncController {
  constructor(private readonly orgSyncService: OrgSyncService) {}

  /** Manual rebuild trigger for admins (ZH and above). */
  @Post('rebuild')
  @MinRole(Role.ZH)
  rebuild(): Promise<OrgGraphCounts> {
    return this.orgSyncService.rebuild();
  }
}
