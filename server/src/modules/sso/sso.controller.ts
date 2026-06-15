import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SsoService } from './sso.service';
import { GetRedirectUriDto } from './dto/get-redirect-uri.dto';
import { VerifySsoTokenDto } from './dto/verify-sso-token.dto';
import { Public } from '../../common/decorators/roles.decorator';

@ApiTags('SSO')
@Controller('v1/sso')
export class SsoController {
  constructor(
    private readonly ssoService: SsoService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Called by the central Roinet SSO server.
   * Accepts a userCode, wraps it in an RSA-signed short-lived token,
   * and returns the redirect URI that the SSO server should redirect the
   * user's browser to.
   *
   * Protected by a shared API key that only the SSO server knows.
   */
  @Post('get-redirect-uri')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate a signed SSO redirect URI (called by SSO server)',
    description:
      'The SSO server hits this endpoint with a userCode. The backend signs a short-lived token and returns the redirect URI pointing back to the frontend /sso/callback page.',
  })
  @ApiHeader({
    name: 'x-sso-api-key',
    description: 'Shared secret known only to the central SSO server',
    required: true,
  })
  getRedirectUri(
    @Body() dto: GetRedirectUriDto,
    @Headers('x-sso-api-key') apiKey: string,
  ): { redirectUri: string } {
    this.validateSsoApiKey(apiKey);
    return this.ssoService.getRedirectUri(dto.userCode);
  }

  /**
   * Called by the frontend callback page after the user is redirected back.
   * Verifies the RSA signature of the SSO token, looks up the user,
   * and sets the same HttpOnly JWT cookie used by the regular login flow.
   */
  @Post('verify-token')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify SSO token and issue session cookie (called by frontend)',
    description:
      'The frontend extracts the token from the redirect URL query param and posts it here. On success, an HttpOnly access_token cookie is set and user data is returned.',
  })
  verifyToken(
    @Body() dto: VerifySsoTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.ssoService.verifyTokenAndLogin(dto.token, res);
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private validateSsoApiKey(provided: string): void {
    const expected = this.config.get<string>('SSO_API_KEY');
    if (!expected) {
      // Fail secure: if the key is not configured, deny all requests
      throw new UnauthorizedException('SSO API key is not configured on this server');
    }
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid SSO API key');
    }
  }
}
