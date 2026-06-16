import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { Role, UserStatus } from '../../common/constants';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async createWithPosp(
    userData: {
      email: string;
      passwordHash: string;
      role: Role;
      status: UserStatus;
    },
    pospData: {
      name: string;
      code: string;
      mobile: string;
      email: string;
      joined: Date;
      active: boolean;
    },
  ): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const posp = await tx.posp.create({
        data: pospData,
      });

      return tx.user.create({
        data: {
          ...userData,
          pospId: posp.id,
        },
      });
    });
  }

  async updateStatus(
    userId: string,
    status: UserStatus,
  ): Promise<{
    id: string;
    email: string;
    role: string;
    status: string;
    pospId: string | null;
  }> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        pospId: true,
      },
    });
  }

  async findPospByCode(code: string): Promise<{ id: string } | null> {
    return this.prisma.posp.findUnique({
      where: { code },
      select: { id: true },
    });
  }

  async findUserByPospCode(code: string): Promise<User | null> {
    const posp = await this.prisma.posp.findUnique({ where: { code } });
    if (!posp) return null;
    return this.prisma.user.findFirst({ where: { pospId: posp.id } });
  }

  async findPospByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.posp.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
  }
}
