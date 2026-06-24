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
      include: { salesTeam: { select: { designation: true } } },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { salesTeam: { select: { designation: true } } },
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

  /**
   * Syncs fresh Cognitensor data into the Posp row identified by `code`.
   * Called on every SSO login so our DB always reflects the latest external state.
   * Only updates fields sourced from Cognitensor; name and internal fields are untouched.
   */
  async upsertPospFromExternal(
    code: string,
    data: {
      externalId: string;
      name: string;
      mobile: string;
      email: string;
      gcdCode: string;
      stateId: string;
      cityId: string;
      districtId: string;
    },
  ): Promise<void> {
    await this.prisma.posp.update({
      where: { code },
      data: {
        externalId: data.externalId,
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        gcdCode: data.gcdCode,
        stateId: data.stateId,
        cityId: data.cityId,
        districtId: data.districtId,
      },
    });
  }

  async findPospByEmail(email: string): Promise<{ id: string } | null> {
    return this.prisma.posp.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
  }

  /**
   * Creates or updates a manager User + SalesTeam stub on their first (and
   * every subsequent) SSO login. The synthetic email `{userCode}@roinet.sso`
   * is the stable unique key — no real email is required.
   */
  async upsertManagerFromSso(params: {
    userCode: string;
    role: Role;
    name: string;
  }): Promise<{ id: string; email: string; role: string; status: string }> {
    const email = `${params.userCode.toLowerCase()}@roinet.sso`;

    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
        select: { id: true, email: true, role: true, status: true },
      });

      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            passwordHash: '',
            role: params.role,
            status: UserStatus.ACTIVE,
          },
          select: { id: true, email: true, role: true, status: true },
        });
      } else if (user.role !== params.role) {
        user = await tx.user.update({
          where: { id: user.id },
          data: { role: params.role, status: UserStatus.ACTIVE },
          select: { id: true, email: true, role: true, status: true },
        });
      }

      // Ensure SalesTeam stub exists so scope resolver can find employeeCode
      const existing = await tx.salesTeam.findUnique({
        where: { userId: user.id },
      });
      if (!existing) {
        await tx.salesTeam.create({
          data: {
            userId: user.id,
            name: params.name,
            employeeCode: params.userCode,
            designation: params.role,
            mobile: '',
            email,
            joiningDate: new Date(),
            status: 'ACTIVE',
          },
        });
      } else if (existing.employeeCode !== params.userCode) {
        await tx.salesTeam.update({
          where: { userId: user.id },
          data: { employeeCode: params.userCode, name: params.name },
        });
      }

      return user;
    });
  }

  /**
   * Upserts district hierarchy rows into the DistrictHierarchy cache table.
   * Called non-blocking (fire-and-forget) after a manager SSO login to keep
   * the cache fresh for scope resolution.
   */
  async syncManagerDistrictHierarchy(
    rows: Array<{
      districtId: string;
      districtName: string;
      dmCode?: string;
      dmId?: string;
      dmName?: string;
      asmCode?: string;
      asmId?: string;
      asmName?: string;
      rhCode?: string;
      rhId?: string;
      rhName?: string;
      zhCode?: string;
      zhId?: string;
      zhName?: string;
      nhCode?: string;
      nhId?: string;
      nhName?: string;
    }>,
  ): Promise<void> {
    for (const row of rows) {
      await this.prisma.districtHierarchy.upsert({
        where: { districtId: row.districtId },
        update: {
          districtName: row.districtName,
          dmId: row.dmId,
          dmCode: row.dmCode,
          dmName: row.dmName,
          asmId: row.asmId,
          asmCode: row.asmCode,
          asmName: row.asmName,
          rhId: row.rhId,
          rhCode: row.rhCode,
          rhName: row.rhName,
          zhId: row.zhId,
          zhCode: row.zhCode,
          zhName: row.zhName,
          nhId: row.nhId,
          nhCode: row.nhCode,
          nhName: row.nhName,
        },
        create: {
          districtId: row.districtId,
          districtName: row.districtName,
          dmId: row.dmId,
          dmCode: row.dmCode,
          dmName: row.dmName,
          asmId: row.asmId,
          asmCode: row.asmCode,
          asmName: row.asmName,
          rhId: row.rhId,
          rhCode: row.rhCode,
          rhName: row.rhName,
          zhId: row.zhId,
          zhCode: row.zhCode,
          zhName: row.zhName,
          nhId: row.nhId,
          nhCode: row.nhCode,
          nhName: row.nhName,
        },
      });
    }
  }
}
