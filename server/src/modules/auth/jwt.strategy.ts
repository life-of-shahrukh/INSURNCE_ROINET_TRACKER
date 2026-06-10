import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { JwtPayload } from '../../common/auth/jwt-payload.interface';
import { Role } from '../../common/constants';

const VALID_ROLES = new Set<string>(Object.values(Role));

function extractJwtFromCookieOrBearer(req: Request): string | null {
  if (req.cookies?.['access_token']) {
    return req.cookies['access_token'] as string;
  }
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: extractJwtFromCookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? 'dev-secret-change-me',
    });
  }

  /**
   * Returning null causes Passport to issue a 401 Unauthorized,
   * which tells the frontend to clear the cookie and redirect to /login.
   * This handles stale JWTs that contain roles from old schema versions.
   */
  validate(payload: JwtPayload): AuthUser | null {
    if (!VALID_ROLES.has(payload.role)) {
      return null; // unknown role → 401, not 403
    }
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      status: payload.status,
      pospId: payload.pospId,
    };
  }
}
