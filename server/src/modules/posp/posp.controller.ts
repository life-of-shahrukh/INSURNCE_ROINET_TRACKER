import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PospService } from './posp.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('POSP')
@Controller('posp')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.POSP)
@ApiBearerAuth()
export class PospController {
  constructor(private readonly pospService: PospService) {}

  @Get()
  @ApiOperation({ summary: 'List all POSPs' })
  @ApiResponse({ status: 200, description: 'Array of POSP records' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.pospService.getAll(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new POSP' })
  @ApiResponse({ status: 201, description: 'Created POSP record' })
  create(@Body() dto: CreatePospDto, @CurrentUser() user: AuthUser) {
    return this.pospService.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a POSP' })
  @ApiResponse({ status: 200, description: 'Updated POSP record' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePospDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pospService.update(id, dto, user);
  }
}
