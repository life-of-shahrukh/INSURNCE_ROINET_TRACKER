import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePospDto } from './dto/create-posp.dto';
import { UpdatePospDto } from './dto/update-posp.dto';
import { Posp } from '@prisma/client';

@Injectable()
export class PospRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Posp[]> {
    return this.prisma.posp.findMany({ orderBy: { createdAt: 'asc' } });
  }

  findByScope(where: Record<string, unknown>): Promise<Posp[]> {
    return this.prisma.posp.findMany({
      where: where as Parameters<typeof this.prisma.posp.findMany>[0]['where'],
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string): Promise<Posp> {
    const posp = await this.prisma.posp.findUnique({ where: { id } });
    if (!posp) throw new NotFoundException(`POSP with id "${id}" not found`);
    return posp;
  }

  async findByEmail(email: string): Promise<Posp | null> {
    return this.prisma.posp.findUnique({ where: { email } });
  }

  create(dto: CreatePospDto): Promise<Posp> {
    return this.prisma.posp.create({
      data: {
        name: dto.name,
        code: dto.code,
        mobile: dto.mobile,
        email: dto.email,
        joined: new Date(dto.joined),
        active: dto.active ?? true,
      },
    });
  }

  async update(id: string, dto: UpdatePospDto): Promise<Posp> {
    await this.findById(id);
    return this.prisma.posp.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.mobile !== undefined && { mobile: dto.mobile }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.joined !== undefined && { joined: new Date(dto.joined) }),
        ...(dto.active !== undefined && { active: dto.active }),
      },
    });
  }
}
