import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Announcement, Prisma } from '@prisma/client';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { AnnouncementListQueryDto } from './dto/announcement-list-query.dto';
import type { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { buildPaginatedResult } from '../../common/utils/pagination.util';

@Injectable()
export class AnnouncementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPaginated(
    filters: AnnouncementListQueryDto,
  ): Promise<PaginatedResult<Announcement>> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const [data, total] = await Promise.all([
      this.prisma.announcement.findMany({
        skip,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.announcement.count(),
    ]);

    return buildPaginatedResult(data, total, page, pageSize);
  }

  async findById(id: string): Promise<Announcement> {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      throw new NotFoundException(`Announcement "${id}" not found`);
    }
    return announcement;
  }

  async findActive(userRole: string, userId: string): Promise<Announcement[]> {
    const now = new Date();

    // Fetch announcements that are active, started, not yet expired,
    // and target this role — then filter out ones dismissed by this user.
    const announcements = await this.prisma.announcement.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        targetRoles: { contains: userRole },
        dismissals: {
          none: { userId },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return announcements;
  }

  create(dto: CreateAnnouncementDto, createdBy: string): Promise<Announcement> {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        targetRoles: dto.targetRoles,
        severity: dto.severity ?? 'info',
        priority: dto.priority ?? 0,
        isActive: dto.isActive ?? true,
        startsAt: new Date(dto.startsAt),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto): Promise<Announcement> {
    await this.findById(id);
    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.targetRoles !== undefined && { targetRoles: dto.targetRoles }),
        ...(dto.severity !== undefined && { severity: dto.severity }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.announcement.delete({ where: { id } });
  }

  async dismiss(announcementId: string, userId: string): Promise<void> {
    await this.findById(announcementId);
    try {
      await this.prisma.announcementDismissal.create({
        data: { announcementId, userId },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Already dismissed — idempotent, treat as success
        return;
      }
      throw error;
    }
  }
}
