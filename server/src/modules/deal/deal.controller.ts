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
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  // Any authenticated user at DM level or above, plus POSP (own deals)
  @Get()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'List deals (scoped by role)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.dealService.getAll(user);
  }

  @Get('export')
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'Export deals as CSV' })
  async exportCsv(@Res() res: Response, @CurrentUser() user: AuthUser) {
    const csv = await this.dealService.exportCsv(user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
    res.send(csv);
  }

  // POSP creates own deals; ASM+ can create for any POSP
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ASM, Role.DM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'Create a new deal' })
  create(@Body() dto: CreateDealDto, @CurrentUser() user: AuthUser) {
    return this.dealService.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.ASM, Role.DM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'Update a deal' })
  update(@Param('id') id: string, @Body() dto: UpdateDealDto, @CurrentUser() user: AuthUser) {
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
