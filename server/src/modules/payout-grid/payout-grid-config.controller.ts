import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { PayoutGridConfigService } from './payout-grid-config.service';
import {
  CreatePayoutGridConfigDto,
  UpdatePayoutGridConfigDto,
} from './dto/payout-grid-config.dto';
import { PayoutGridService } from './payout-grid.service';

@Controller('payout-grid-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class PayoutGridConfigController {
  constructor(
    private readonly configService: PayoutGridConfigService,
    private readonly gridService: PayoutGridService,
  ) {}

  @Get()
  async findAll(): Promise<unknown> {
    const configs = await this.configService.findAll();
    const { insurers } = this.gridService.getMeta();
    return { configs, insurers };
  }

  @Post()
  async upsert(@Body() dto: CreatePayoutGridConfigDto): Promise<unknown> {
    return this.configService.upsert(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePayoutGridConfigDto,
  ): Promise<unknown> {
    return this.configService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.configService.remove(id);
    return { success: true };
  }
}
