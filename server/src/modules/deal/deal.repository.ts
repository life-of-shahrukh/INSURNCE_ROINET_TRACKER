import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { UpdateDealDto } from './dto/update-deal.dto';
import { Deal, Prisma } from '@prisma/client';

@Injectable()
export class DealRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Deal[]> {
    return this.prisma.deal.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findAllByPospId(pospId: string): Promise<Deal[]> {
    return this.prisma.deal.findMany({
      where: { pospId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Deal> {
    const deal = await this.prisma.deal.findUnique({ where: { id } });
    if (!deal) throw new NotFoundException(`Deal with id "${id}" not found`);
    return deal;
  }

  async findByIdForPosp(id: string, pospId: string): Promise<Deal> {
    const deal = await this.prisma.deal.findFirst({ where: { id, pospId } });
    if (!deal) {
      throw new NotFoundException(`Deal with id "${id}" not found`);
    }
    return deal;
  }

  create(dto: CreateDealDto): Promise<Deal> {
    return this.prisma.deal.create({
      data: {
        pospId: dto.pospId,
        customer: dto.customer,
        policy: dto.policy,
        sum: dto.sum,
        premium: dto.premium,
        coa: dto.coa,
        margin: dto.margin,
        status: dto.status,
        expected: new Date(dto.expected),
        proposal: dto.proposal,
        policyNo: dto.policyNo ?? '',
        issued: dto.issued ? new Date(dto.issued) : null,
        remarks: dto.remarks ?? '',
      },
    }).catch(this.handlePrismaError);
  }

  createForPosp(pospId: string, dto: CreateDealDto): Promise<Deal> {
    return this.prisma.deal.create({
      data: {
        pospId,
        customer: dto.customer,
        policy: dto.policy,
        sum: dto.sum,
        premium: dto.premium,
        coa: dto.coa,
        margin: dto.margin,
        status: dto.status,
        expected: new Date(dto.expected),
        proposal: dto.proposal,
        policyNo: dto.policyNo ?? '',
        issued: dto.issued ? new Date(dto.issued) : null,
        remarks: dto.remarks ?? '',
      },
    }).catch(this.handlePrismaError);
  }

  async update(id: string, dto: UpdateDealDto): Promise<Deal> {
    await this.findById(id);
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.pospId !== undefined && { pospId: dto.pospId }),
        ...(dto.customer !== undefined && { customer: dto.customer }),
        ...(dto.policy !== undefined && { policy: dto.policy }),
        ...(dto.sum !== undefined && { sum: dto.sum }),
        ...(dto.premium !== undefined && { premium: dto.premium }),
        ...(dto.coa !== undefined && { coa: dto.coa }),
        ...(dto.margin !== undefined && { margin: dto.margin }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expected !== undefined && { expected: new Date(dto.expected) }),
        ...(dto.proposal !== undefined && { proposal: dto.proposal }),
        ...(dto.policyNo !== undefined && { policyNo: dto.policyNo }),
        ...(dto.issued !== undefined && {
          issued: dto.issued ? new Date(dto.issued) : null,
        }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
    });
  }

  async updateByPosp(id: string, pospId: string, dto: UpdateDealDto): Promise<Deal> {
    await this.findByIdForPosp(id, pospId);
    return this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.customer !== undefined && { customer: dto.customer }),
        ...(dto.policy !== undefined && { policy: dto.policy }),
        ...(dto.sum !== undefined && { sum: dto.sum }),
        ...(dto.premium !== undefined && { premium: dto.premium }),
        ...(dto.coa !== undefined && { coa: dto.coa }),
        ...(dto.margin !== undefined && { margin: dto.margin }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.expected !== undefined && { expected: new Date(dto.expected) }),
        ...(dto.proposal !== undefined && { proposal: dto.proposal }),
        ...(dto.policyNo !== undefined && { policyNo: dto.policyNo }),
        ...(dto.issued !== undefined && {
          issued: dto.issued ? new Date(dto.issued) : null,
        }),
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.deal.delete({ where: { id } });
  }

  async deleteByPosp(id: string, pospId: string): Promise<void> {
    await this.prisma.deal.deleteMany({ where: { id, pospId } });
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid POSP selected — please refresh and try again');
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }
    }
    throw error;
  }

  async exportCsv(): Promise<string> {
    const deals = await this.findAll();
    const header =
      'id,pospId,customer,policy,sum,premium,coa,margin,status,expected,proposal,policyNo,issued,remarks';
    const rows = deals.map((d) =>
      [
        d.id,
        d.pospId,
        `"${d.customer}"`,
        d.policy,
        d.sum,
        d.premium,
        d.coa,
        d.margin,
        d.status,
        d.expected.toISOString().split('T')[0],
        d.proposal,
        d.policyNo,
        d.issued ? d.issued.toISOString().split('T')[0] : '',
        `"${d.remarks}"`,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }

  async exportCsvByPosp(pospId: string): Promise<string> {
    const deals = await this.findAllByPospId(pospId);
    const header =
      'id,pospId,customer,policy,sum,premium,coa,margin,status,expected,proposal,policyNo,issued,remarks';
    const rows = deals.map((d) =>
      [
        d.id,
        d.pospId,
        `"${d.customer}"`,
        d.policy,
        d.sum,
        d.premium,
        d.coa,
        d.margin,
        d.status,
        d.expected.toISOString().split('T')[0],
        d.proposal,
        d.policyNo,
        d.issued ? d.issued.toISOString().split('T')[0] : '',
        `"${d.remarks}"`,
      ].join(','),
    );
    return [header, ...rows].join('\n');
  }
}
