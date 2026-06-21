import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Profile')
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('by-code/:userCode')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({
    summary:
      'Get a user profile by Cognitensor userCode (Posp.code or SalesTeam.employeeCode)',
  })
  @ApiParam({
    name: 'userCode',
    description: 'Cognitensor UserCode, e.g. CSP023057 or RAMANUJ.BIHARJHKZM',
  })
  getByUserCode(
    @Param('userCode') userCode: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.profileService.getProfileByUserCode(userCode, user);
  }

  @Get()
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Get the profile of the currently logged-in user' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.profileService.getProfile(user.userId);
  }
}
