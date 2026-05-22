import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PospService } from './posp.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';

@ApiTags('POSP')
@Controller('posp')
export class PospController {
  constructor(private readonly pospService: PospService) {}

  @Get()
  @ApiOperation({ summary: 'List all POSPs' })
  @ApiResponse({ status: 200, description: 'Array of POSP records' })
  findAll() {
    return this.pospService.getAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new POSP' })
  @ApiResponse({ status: 201, description: 'Created POSP record' })
  create(@Body() dto: CreatePospDto) {
    return this.pospService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a POSP' })
  @ApiResponse({ status: 200, description: 'Updated POSP record' })
  update(@Param('id') id: string, @Body() dto: UpdatePospDto) {
    return this.pospService.update(id, dto);
  }
}
