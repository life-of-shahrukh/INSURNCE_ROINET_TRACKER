import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OtpService } from './otp.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('OTP')
@Controller('otp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to customer mobile number' })
  send(@Body() dto: SendOtpDto): Promise<{ requestId: string }> {
    return this.otpService.sendOtp(dto.mobile);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and optionally mark customer mobile as verified' })
  verify(@Body() dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    return this.otpService.verifyOtp(dto.requestId, dto.code, dto.customerId);
  }
}
