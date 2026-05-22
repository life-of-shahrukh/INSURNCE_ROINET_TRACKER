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
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';

@ApiTags('Deals')
@Controller('deals')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  @ApiOperation({ summary: 'List all deals' })
  @ApiResponse({ status: 200, description: 'Array of Deal records' })
  findAll() {
    return this.dealService.getAll();
  }

  @Get('export')
  @ApiOperation({ summary: 'Export deals as CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download' })
  async exportCsv(@Res() res: Response) {
    const csv = await this.dealService.exportCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="deals.csv"');
    res.send(csv);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new deal' })
  @ApiResponse({ status: 201, description: 'Created Deal record' })
  create(@Body() dto: CreateDealDto) {
    return this.dealService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deal' })
  @ApiResponse({ status: 200, description: 'Updated Deal record' })
  update(@Param('id') id: string, @Body() dto: UpdateDealDto) {
    return this.dealService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a deal' })
  @ApiResponse({ status: 204, description: 'Deal deleted' })
  remove(@Param('id') id: string) {
    return this.dealService.delete(id);
  }
}
