import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { SignupPospDto } from './dto/signup-posp.dto';
import { Role, UserStatus } from '../../common/constants';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { ApprovePospDto } from './dto/approve-posp.dto';
import { JwtPayload } from '../../common/auth/jwt-payload.interface';
import { AuthUser } from '../../common/auth/auth-user.interface';
import { UserRepository } from './user.repository';

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
    private readonly userRepo: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(dto.email);

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

    return this.createResponse({
      ...user,
      role: user.role as Role,
      status: user.status as UserStatus,
    });
  }

  async signupPosp(dto: SignupPospDto) {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.userRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new BadRequestException('Email is already registered');
    }

    const existingPospCode = await this.userRepo.findPospByCode(dto.code);
    if (existingPospCode) {
      throw new BadRequestException('POSP code is already in use');
    }

    const existingPospEmail = await this.userRepo.findPospByEmail(
      normalizedEmail,
    );
    if (existingPospEmail) {
      throw new BadRequestException('POSP email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    let user: {
      id: string;
      email: string;
      role: string;
      status: string;
      pospId: string | null;
    };

    try {
      user = await this.userRepo.createWithPosp(
        {
          email: normalizedEmail,
          passwordHash,
          role: Role.POSP,
          status: UserStatus.ACTIVE,
        },
        {
          name: dto.name,
          code: dto.code,
          mobile: dto.mobile,
          email: normalizedEmail,
          joined: new Date(dto.joined),
          active: dto.active ?? true,
        },
      );
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
      ...this.createResponse({
        ...user,
        role: user.role as Role,
        status: user.status as UserStatus,
      }),
      message: 'Signup successful. You now have direct access.',
    };
  }

  async approvePosp(userId: string, dto: ApprovePospDto) {
    const user = await this.userRepo.findById(userId);
    if (!user || user.role !== Role.POSP) {
      throw new BadRequestException('POSP user not found');
    }

    return this.userRepo.updateStatus(userId, dto.status);
  }

  async me(user: AuthUser) {
    const profile = await this.userRepo.findById(user.userId);

    if (profile) {
      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        pospId: profile.pospId,
      };
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
