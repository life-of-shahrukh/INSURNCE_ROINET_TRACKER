import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Res, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupPospDto } from './dto/signup-posp.dto';
import { ApprovePospDto } from './dto/approve-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Public } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login — sets HttpOnly JWT cookie' })
  login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, res);
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear JWT cookie' })
  logout(@Res({ passthrough: true }) res: Response): void {
    this.authService.logout(res);
  }

  @Post('signup-posp')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'POSP self-signup — sets HttpOnly JWT cookie' })
  signupPosp(
    @Body() dto: SignupPospDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.signupPosp(dto, res);
  }

  @Patch('approve-posp/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @MinRole(Role.ASM)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or inactivate a POSP user (ASM+)' })
  approvePosp(@Param('userId') userId: string, @Body() dto: ApprovePospDto) {
    return this.authService.approvePosp(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current session user (reads cookie)' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
