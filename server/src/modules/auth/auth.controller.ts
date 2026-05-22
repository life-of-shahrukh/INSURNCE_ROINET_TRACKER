import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupPospDto } from './dto/signup-posp.dto';
import { ApprovePospDto } from './dto/approve-posp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../../common/auth/auth-user.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access token and user profile' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('signup-posp')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Signup a POSP account with direct access' })
  @ApiResponse({ status: 201, description: 'POSP signup successful with access token' })
  signupPosp(@Body() dto: SignupPospDto) {
    return this.authService.signupPosp(dto);
  }

  @Patch('approve-posp/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or inactivate a POSP user' })
  @ApiResponse({ status: 200, description: 'Updated POSP user status' })
  approvePosp(@Param('userId') userId: string, @Body() dto: ApprovePospDto) {
    return this.authService.approvePosp(userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
