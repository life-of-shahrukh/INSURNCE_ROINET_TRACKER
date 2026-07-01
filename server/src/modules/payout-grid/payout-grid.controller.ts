import {
  Controller,
  Get,
  Post,
  Query,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/constants';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { PayoutGridService, CommissionRecord, CommissionMeta } from './payout-grid.service';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import { SearchPayoutGridDto } from './dto/search-payout-grid.dto';

@Controller('payout-grids')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PayoutGridController {
  constructor(
    private readonly gridService: PayoutGridService,
    private readonly externalApi: ExternalApiService,
  ) {}

  @Get('meta')
  @MinRole(Role.POSP)
  async getMeta(): Promise<CommissionMeta> {
    const { lobs, insurers, lastUpdated } = this.gridService.getMeta();

    const [states, zones] = await Promise.all([
      this.externalApi.listStates(),
      this.externalApi.listZones(),
    ]);

    return {
      lobs,
      insurers,
      states: states.map((s) => ({
        stateId: s.StateId,
        stateName: s.StateName,
        stateCode: s.StateCode,
      })),
      zones: zones.map((z) => ({
        zoneId: z.Zoneid,
        zoneName: z.ZoneName,
      })),
      lastUpdated,
    };
  }

  @Get('search')
  @MinRole(Role.POSP)
  search(
    @Query() dto: SearchPayoutGridDto,
    @CurrentUser() user: AuthUser,
  ): CommissionRecord[] {
    let results = this.gridService.searchCommissions(dto);

    if (user.role !== Role.SUPER_ADMIN) {
      results = this.gridService.applyCommissionReduction(results);
    }

    return results;
  }

  @Post('upload')
  @Roles(Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadGrid(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; recordCount: number }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (
      !file.originalname.endsWith('.xlsx') &&
      !file.originalname.endsWith('.xls')
    ) {
      throw new BadRequestException('Only .xlsx or .xls files are supported');
    }

    const { recordCount } = await this.gridService.processUploadedFile(file.buffer);

    return {
      success: true,
      message: `File "${file.originalname}" processed: ${recordCount} commission records loaded`,
      recordCount,
    };
  }
}
