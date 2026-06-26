import {
  Injectable,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import type { Logger } from 'winston';
import type { Response } from 'express';
import * as crypto from 'node:crypto';
import { UserRepository } from '../auth/user.repository';
import { Role, UserStatus } from '../../common/constants';
import { AuthUserPayload } from '../auth/auth.service';
import { buildAuthUserPayload } from '../auth/auth-payload.util';
import { ExternalApiService } from '../../common/external-api/external-api.service';
import { resolvePospDisplayName } from '../../common/external-api/posp-display.util';
import type { ExternalHierarchyUser } from '../../common/external-api/external-api.types';

const COOKIE_NAME = 'access_token';

interface SsoTokenPayload {
  userCode: string;
  nonce: string;
  iat: number;
  exp: number;
}

/** Shape of the JSON response from the Xpresso SSO token-info endpoint. */
interface _XpressoTokenInfo {
  /** The Roinet user code (e.g. "RC123456") returned by Xpresso after authentication. */
  userCode?: string;
  /** Alternative field name some Xpresso environments use. */
  UserCode?: string;
  /** Xpresso may also return the email or username directly. */
  email?: string;
  username?: string;
}

@Injectable()
export class SsoService {
  constructor(
    private readonly config: ConfigService,
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
    private readonly externalApiService: ExternalApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  /**
   * Called by the central SSO server.
   * Signs a short-lived token containing the userCode and returns a redirect URI
   * that the SSO server will use to bounce the user back to the frontend.
   * isPosp is appended as a plain query param (not inside the signed token).
   */
  getRedirectUri(userCode: string, isPosp: boolean): { redirectUri: string } {
    const token = this.signSsoToken(userCode);
    const base =
      this.config.get<string>('SSO_REDIRECT_BASE_URL') ??
      'https://insuranceroinet.xyz';
    const redirectUri = `${base}/sso/callback?token=${encodeURIComponent(token)}&isPosp=${isPosp}`;
    this.logger.info('SSO redirect URI generated', {
      context: 'SsoService',
      userCode,
      isPosp,
    });
    return { redirectUri };
  }

  /**
   * Called by the frontend after the user is bounced back via the redirect URI.
   * Verifies the RSA signature, checks expiry, finds the user, and sets the
   * same HttpOnly JWT cookie that the regular login uses.
   *
   * isPosp is passed separately (read by frontend from the redirect URI query param,
   * not embedded in the signed token itself).
   *   - true  → POSP login: validates via Cognitensor ListPospData, looks up local user by POSP code
   *   - false → Hierarchical manager login (placeholder — not yet implemented)
   */
  async verifyTokenAndLogin(
    token: string,
    isPosp: boolean,
    res: Response,
  ): Promise<AuthUserPayload> {
    const payload = this.verifySsoToken(token);

    if (!isPosp) {
      return this.loginManager(payload.userCode, res);
    }

    // Fetch fresh POSP data from Cognitensor (throws NotFoundException if not found)
    const pospData = await this.externalApiService.getPospByUserCode(
      payload.userCode,
    );

    // Sync Cognitensor fields into our DB so data stays current after every login
    await this.userRepo.upsertPospFromExternal(payload.userCode, {
      externalId: pospData.UserId,
      name: resolvePospDisplayName(pospData),
      mobile: pospData.MobileNo,
      email: pospData.EmailId,
      gcdCode: pospData.HephGcdCode,
      stateId: pospData.stateid ?? '',
      cityId: pospData.cityid ?? '',
      districtId: pospData.districtid ?? '',
    });

    const user = await this.userRepo.findUserByPospCode(payload.userCode);
    if (!user) {
      this.logger.warn('SSO login failed: no CRM account for POSP code', {
        context: 'SsoService',
        userCode: payload.userCode,
        isPosp,
      });
      throw new UnauthorizedException(
        `No CRM account linked to POSP code "${payload.userCode}"`,
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn('SSO login failed: account inactive', {
        context: 'SsoService',
        userCode: payload.userCode,
        userId: user.id,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    const jwtToken = this.signAppJwt({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      status: user.status,
      pospId: user.pospId ?? undefined,
    });

    this.setAuthCookie(res, jwtToken);

    this.logger.info('SSO POSP login successful', {
      context: 'SsoService',
      userCode: payload.userCode,
      userId: user.id,
      email: user.email,
    });

    return buildAuthUserPayload({ ...user, salesTeam: null });
  }

  // ─── Manager login path ───────────────────────────────────────────────────

  private async loginManager(
    userCode: string,
    res: Response,
  ): Promise<AuthUserPayload> {
    const identity = await this.externalApiService.getManagerIdentity(userCode);

    this.logger.info('SSO manager login attempt', {
      context: 'SsoService',
      userCode,
      role: identity.role,
      districtCount: identity.districtIds.length,
    });

    const user = await this.userRepo.upsertManagerFromSso({
      userCode,
      role: identity.role,
      name: identity.userName,
    });

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn('SSO manager login failed: account inactive', {
        context: 'SsoService',
        userCode,
        userId: user.id,
        status: user.status,
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Sync district hierarchy cache asynchronously — does not block login response
    this.syncHierarchyCache(identity.districtIds, userCode).catch(
      (err: unknown) =>
        this.logger.warn('Failed to sync hierarchy cache', {
          context: 'SsoService',
          userCode,
          error: err instanceof Error ? err.message : String(err),
        }),
    );

    const jwtToken = this.signAppJwt({
      id: user.id,
      email: user.email,
      role: user.role as Role,
      status: user.status,
    });

    this.setAuthCookie(res, jwtToken);

    this.logger.info('SSO manager login successful', {
      context: 'SsoService',
      userCode,
      userId: user.id,
      role: identity.role,
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role as Role,
      status: user.status as UserStatus,
      pospId: null,
    };
  }

  /**
   * Fetches full hierarchy rows for the given districtIds and upserts them
   * into the DistrictHierarchy cache table so scope resolution can fall back
   * to the DB when the live Cognitensor API is unavailable.
   */
  private async syncHierarchyCache(
    districtIds: string[],
    userCode: string,
  ): Promise<void> {
    const rows = await this.externalApiService.listHierarchy({ userCode });
    if (!rows || rows.length === 0) return;

    const mapped = rows
      .filter((r: ExternalHierarchyUser) => districtIds.includes(r.DistrictId))
      .map((r: ExternalHierarchyUser) => ({
        districtId: r.DistrictId,
        districtName: r.DistrictName,
        dmId: r.DistrictManagerId || undefined,
        dmCode: r.DistrictManagerCode || undefined,
        dmName: r.DistrictManagerName || undefined,
        asmId: r.R1_UserId || undefined,
        asmCode: r.R1_UserCode || undefined,
        asmName: r.R1_UserName || undefined,
        rhId: r.R2_UserId || undefined,
        rhCode: r.R2_UserCode || undefined,
        rhName: r.R2_UserName || undefined,
        zhId: r.R3_UserId || undefined,
        zhCode: r.R3_UserCode || undefined,
        zhName: r.R3_UserName || undefined,
        nhId: r.R4_UserId || undefined,
        nhCode: r.R4_UserCode || undefined,
        nhName: r.R4_UserName || undefined,
      }));

    await this.userRepo.syncManagerDistrictHierarchy(mapped);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private setAuthCookie(res: Response, token: string): void {
    const expiryMs = 8 * 60 * 60 * 1000;
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: expiryMs,
    });
  }

  private signSsoToken(userCode: string): string {
    const privateKeyPem = this.getSsoPrivateKey();
    const expirySecs = Number.parseInt(
      this.config.get<string>('SSO_TOKEN_EXPIRY_SECONDS') ?? '300',
      10,
    );

    const now = Math.floor(Date.now() / 1000);
    const payload: SsoTokenPayload = {
      userCode,
      nonce: crypto.randomBytes(16).toString('hex'),
      iat: now,
      exp: now + expirySecs,
    };

    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', typ: 'SSO' }),
    ).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${header}.${body}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signingInput);
    const signature = sign.sign(privateKeyPem, 'base64url');

    return `${signingInput}.${signature}`;
  }

  private verifySsoToken(token: string): SsoTokenPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new UnauthorizedException('Malformed SSO token');
    }

    const [header, body, signature] = parts;
    const signingInput = `${header}.${body}`;

    const publicKeyPem = this.getSsoPublicKey();
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(signingInput);

    let valid: boolean;
    try {
      valid = verify.verify(publicKeyPem, signature, 'base64url');
    } catch {
      throw new UnauthorizedException(
        'SSO token signature verification failed',
      );
    }

    if (!valid) {
      throw new UnauthorizedException('Invalid SSO token signature');
    }

    let payload: SsoTokenPayload;
    try {
      payload = JSON.parse(
        Buffer.from(body, 'base64url').toString('utf8'),
      ) as SsoTokenPayload;
    } catch {
      throw new UnauthorizedException('Malformed SSO token payload');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new UnauthorizedException('SSO token has expired');
    }

    if (!payload.userCode || !payload.nonce) {
      throw new UnauthorizedException('SSO token is missing required claims');
    }

    return payload;
  }

  private signAppJwt(user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    pospId?: string;
  }): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      ...(user.pospId ? { pospId: user.pospId } : {}),
    });
  }

  private getSsoPrivateKey(): string {
    const key = this.config.get<string>('SSO_RSA_PRIVATE_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'SSO_RSA_PRIVATE_KEY is not configured',
      );
    }
    // Allow newline-escaped keys stored as single-line env vars
    return key.replaceAll(String.raw`\n`, '\n');
  }

  private getSsoPublicKey(): string {
    const key = this.config.get<string>('SSO_RSA_PUBLIC_KEY');
    if (!key) {
      throw new InternalServerErrorException(
        'SSO_RSA_PUBLIC_KEY is not configured',
      );
    }
    return key.replaceAll(String.raw`\n`, '\n');
  }
}
