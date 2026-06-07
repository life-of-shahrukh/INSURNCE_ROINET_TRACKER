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
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Deals')
@Controller('deals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.POSP)
@ApiBearerAuth()
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  @ApiOperation({ summary: 'List all deals' })
  @ApiResponse({ status: 200, description: 'Array of Deal records' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.dealService.getAll(user);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export deals as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(@Res() res: Response, @CurrentUser() user: AuthUser) {
    const csv = await this.dealService.exportCsv(user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
    res.send(csv);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Created Deal record' })
  create(@Body() dto: CreateDealDto, @CurrentUser() user: AuthUser) {
    return this.dealService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deal' })
  @ApiResponse({ status: 200, description: 'Updated Deal record' })
  update(@Param('id') id: string, @Body() dto: UpdateDealDto, @CurrentUser() user: AuthUser) {
    return this.dealService.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiResponse({ status: 204, description: 'Deal deleted' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dealService.delete(id, user);
  }
}
