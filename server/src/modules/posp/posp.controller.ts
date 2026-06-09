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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PospService } from './posp.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('POSP')
@Controller('posp')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PospController {
  constructor(private readonly pospService: PospService) {}

  // DM and above can list POSPs; POSP can see own profile
  @Get()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'List POSPs (scoped by role)' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.pospService.getAll(user);
  }

  // Only ASM and above can create/register POSPs
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @MinRole(Role.ASM)
  @ApiOperation({ summary: 'Register a new POSP (ASM+)' })
  create(@Body() dto: CreatePospDto, @CurrentUser() user: AuthUser) {
    return this.pospService.create(dto, user);
  }

  // ASM+ or POSP editing own profile
  @Patch(':id')
  @Roles(Role.ASM, Role.DM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  @ApiOperation({ summary: 'Update a POSP' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePospDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.pospService.update(id, dto, user);
  }
}
