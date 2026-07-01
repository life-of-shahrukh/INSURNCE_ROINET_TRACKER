import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePayoutGridConfigDto,
  UpdatePayoutGridConfigDto,
} from './dto/payout-grid-config.dto';

interface PayoutGridConfigRecord {
  id: string;
  scopeType: string;
  scopeValue: string;
  insurerSlug: string | null;
  visible: boolean;
  restrictions: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ParsedRestrictions {
  vehicleTypes?: string[];
  policyTypes?: string[];
}

@Injectable()
export class PayoutGridConfigService {
  private readonly logger = new Logger(PayoutGridConfigService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PayoutGridConfigRecord[]> {
    return this.prisma.payoutGridConfig.findMany({
      orderBy: [{ scopeType: 'asc' }, { scopeValue: 'asc' }],
    });
  }

  async findByScopeAndInsurer(
    scopeType: string,
    scopeValue: string,
    insurerSlug?: string,
  ): Promise<PayoutGridConfigRecord | null> {
    return this.prisma.payoutGridConfig.findUnique({
      where: {
        scopeType_scopeValue_insurerSlug: {
          scopeType,
          scopeValue,
          insurerSlug: insurerSlug ?? '',
        },
      },
    });
  }

  async getVisibleInsurersForUser(
    role: string,
    pospId?: string,
  ): Promise<{ visibleSlugs: string[] | null; restrictions: Map<string, ParsedRestrictions> }> {
    const configs = await this.prisma.payoutGridConfig.findMany({
      where: {
        OR: [
          { scopeType: 'ROLE', scopeValue: role },
          ...(pospId ? [{ scopeType: 'POSP' as const, scopeValue: pospId }] : []),
        ],
      },
    });

    if (configs.length === 0) {
      return { visibleSlugs: null, restrictions: new Map() };
    }

    const hiddenSlugs = new Set<string>();
    const restrictions = new Map<string, ParsedRestrictions>();

    for (const cfg of configs) {
      if (!cfg.visible && cfg.insurerSlug) {
        hiddenSlugs.add(cfg.insurerSlug);
      }
      if (cfg.restrictions && cfg.insurerSlug) {
        try {
          restrictions.set(cfg.insurerSlug, JSON.parse(cfg.restrictions));
        } catch {
          this.logger.warn(`Invalid restrictions JSON for config ${cfg.id}`);
        }
      }
    }

    if (hiddenSlugs.size === 0) {
      return { visibleSlugs: null, restrictions };
    }

    return {
      visibleSlugs: null,
      restrictions,
    };
  }

  async isInsurerVisibleForUser(
    role: string,
    pospId: string | undefined,
    insurerSlug: string,
  ): Promise<boolean> {
    const configs = await this.prisma.payoutGridConfig.findMany({
      where: {
        OR: [
          { scopeType: 'ROLE', scopeValue: role, insurerSlug },
          { scopeType: 'ROLE', scopeValue: role, insurerSlug: null },
          ...(pospId
            ? [
                { scopeType: 'POSP' as const, scopeValue: pospId, insurerSlug },
                { scopeType: 'POSP' as const, scopeValue: pospId, insurerSlug: null as string | null },
              ]
            : []),
        ],
      },
    });

    // POSP-level configs override role-level
    const pospConfig = configs.find(
      (c) => c.scopeType === 'POSP' && c.insurerSlug === insurerSlug,
    );
    if (pospConfig) return pospConfig.visible;

    const roleConfig = configs.find(
      (c) => c.scopeType === 'ROLE' && c.insurerSlug === insurerSlug,
    );
    if (roleConfig) return roleConfig.visible;

    // Global role toggle
    const globalConfig = configs.find(
      (c) => c.scopeType === 'ROLE' && c.insurerSlug === null,
    );
    if (globalConfig) return globalConfig.visible;

    return true;
  }

  async upsert(dto: CreatePayoutGridConfigDto): Promise<PayoutGridConfigRecord> {
    return this.prisma.payoutGridConfig.upsert({
      where: {
        scopeType_scopeValue_insurerSlug: {
          scopeType: dto.scopeType,
          scopeValue: dto.scopeValue,
          insurerSlug: dto.insurerSlug ?? '',
        },
      },
      create: {
        scopeType: dto.scopeType,
        scopeValue: dto.scopeValue,
        insurerSlug: dto.insurerSlug ?? null,
        visible: dto.visible,
        restrictions: dto.restrictions ?? null,
      },
      update: {
        visible: dto.visible,
        restrictions: dto.restrictions ?? null,
      },
    }) as unknown as PayoutGridConfigRecord;
  }

  async update(
    id: string,
    dto: UpdatePayoutGridConfigDto,
  ): Promise<PayoutGridConfigRecord> {
    return this.prisma.payoutGridConfig.update({
      where: { id },
      data: {
        ...(dto.visible !== undefined && { visible: dto.visible }),
        ...(dto.restrictions !== undefined && { restrictions: dto.restrictions }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.payoutGridConfig.delete({ where: { id } });
  }
}
