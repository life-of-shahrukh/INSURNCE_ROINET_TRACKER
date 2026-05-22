import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupPospDto } from './dto/signup-posp.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ApprovePospDto } from './dto/approve-posp.dto';
import { JwtPayload } from '../../common/auth/jwt-payload.interface';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { Prisma } from '@prisma/client';

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    pospId: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const demoAnyAdmin = process.env.AUTH_DEMO_ANY_EMAIL_ADMIN === 'true';
    if (demoAnyAdmin) {
      return this.createResponse({
        id: `demo-${dto.email}`,
        email: dto.email,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        pospId: null,
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active yet');
    }

    return this.createResponse(user);
  }

  async signupPosp(dto: SignupPospDto) {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const existingPospCode = await this.prisma.posp.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (existingPospCode) {
      throw new BadRequestException('POSP code is already in use');
    }

    const existingPospEmail = await this.prisma.posp.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingPospEmail) {
      throw new BadRequestException('POSP email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let user: {
      id: string;
      email: string;
      role: Role;
      status: UserStatus;
      pospId: string | null;
    };

    try {
      user = await this.prisma.$transaction(async (tx) => {
        const posp = await tx.posp.create({
          data: {
            name: dto.name,
            code: dto.code,
            mobile: dto.mobile,
            email: normalizedEmail,
            joined: new Date(dto.joined),
            active: dto.active ?? true,
          },
        });

        return tx.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            role: Role.POSP,
            status: UserStatus.ACTIVE,
            pospId: posp.id,
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Signup failed: duplicate email or POSP code already exists',
        );
      }
      throw error;
    }

    return {
      ...this.createResponse(user),
      message: 'Signup successful. You now have direct access.',
    };
  }

  async approvePosp(userId: string, dto: ApprovePospDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== Role.POSP) {
      throw new BadRequestException('POSP user not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: dto.status as UserStatus,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        pospId: true,
      },
    });
  }

  async me(user: AuthUser) {
    const profile = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        pospId: true,
      },
    });

    if (profile) {
      return profile;
    }

    return {
      id: user.userId,
      email: user.email,
      role: user.role,
      status: user.status,
      pospId: user.pospId ?? null,
    };
  }

  private createResponse(user: {
    id: string;
    email: string;
    role: Role;
    status: UserStatus;
    pospId: string | null;
  }): AuthResponse {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      ...(user.pospId ? { pospId: user.pospId } : {}),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
