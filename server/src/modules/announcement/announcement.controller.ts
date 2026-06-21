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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnnouncementService } from './announcement.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementListQueryDto } from './dto/announcement-list-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Announcements')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Get('active')
  @Roles(
    Role.SUPER_ADMIN,
    Role.NATIONAL_HEAD,
    Role.ZH,
    Role.RH,
    Role.ASM,
    Role.DM,
    Role.POSP,
  )
  @ApiOperation({ summary: 'Get active announcements for the current user' })
  getActive(@CurrentUser() user: AuthUser) {
    return this.announcementService.getActive(user);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List all announcements (admin, paginated)' })
  findAll(@Query() query: AnnouncementListQueryDto) {
    return this.announcementService.getAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new announcement' })
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthUser) {
    return this.announcementService.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an announcement' })
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    return this.announcementService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id') id: string) {
    return this.announcementService.delete(id);
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(
    Role.SUPER_ADMIN,
    Role.NATIONAL_HEAD,
    Role.ZH,
    Role.RH,
    Role.ASM,
    Role.DM,
    Role.POSP,
  )
  @ApiOperation({ summary: 'Dismiss an announcement for the current user' })
  dismiss(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.announcementService.dismiss(id, user);
  }
}
