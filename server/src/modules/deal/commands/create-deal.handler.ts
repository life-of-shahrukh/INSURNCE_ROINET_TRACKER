import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateDealCommand } from '../commands/create-deal.command';
import { DealRepository } from '../deal.repository';
import { DealCreatedEvent } from '../events/deal-created.event';
import { DealStatus } from '../../../common/constants';
import { PrismaService } from '../../../prisma/prisma.service';
import { Deal } from '@prisma/client';

function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PRP-${year}-${random}`;
}

interface GeoFields {
  zoneId: string | null;
  regionId: string | null;
  areaId: string | null;
  districtId: string | null;
}

const NULL_GEO: GeoFields = {
  zoneId: null,
  regionId: null,
  areaId: null,
  districtId: null,
};

@CommandHandler(CreateDealCommand)
export class CreateDealHandler implements ICommandHandler<CreateDealCommand> {
  constructor(
    private readonly dealRepo: DealRepository,
    private readonly eventBus: EventBus,
    private readonly prisma: PrismaService,
  ) {}

  async execute(command: CreateDealCommand): Promise<Deal> {
    const dto = { ...command.dto };

    if (!dto.proposal) {
      dto.proposal = generateProposalNumber();
    }

    const geo = await this.resolveGeo(dto.pospId ?? null, command.userId);
    dto.zoneId = geo.zoneId ?? undefined;
    dto.regionId = geo.regionId ?? undefined;
    dto.areaId = geo.areaId ?? undefined;
    dto.districtId = geo.districtId ?? undefined;

    const deal = await this.dealRepo.create(dto);
    this.eventBus.publish(
      new DealCreatedEvent(deal.id, deal.pospId, deal.status as DealStatus),
    );
    return deal;
  }

  /**
   * Resolves geo scope for a new deal using a 4-tier fallback chain:
   *  1. POSP's own geo fields (populated when the POSP was synced)
   *  2. ASM's SalesTeam territory (via Posp.asmId)
   *  3. DM's SalesTeam territory (via Posp.areaId matching a SalesTeam.areaId)
   *  4. Creating manager's own SalesTeam territory (for "Self" deals)
   */
  private async resolveGeo(
    pospId: string | null,
    userId: string,
  ): Promise<GeoFields> {
    if (pospId) {
      const posp = await this.prisma.posp.findUnique({
        where: { id: pospId },
        select: {
          zoneId: true,
          regionId: true,
          areaId: true,
          districtId: true,
          asmId: true,
        },
      });

      if (posp) {
        // Tier 1: POSP has its own geo fields already populated
        if (posp.zoneId || posp.regionId || posp.areaId || posp.districtId) {
          return {
            zoneId: posp.zoneId,
            regionId: posp.regionId,
            areaId: posp.areaId,
            districtId: posp.districtId,
          };
        }

        // Tier 2: Inherit from linked ASM's territory
        if (posp.asmId) {
          const asm = await this.prisma.salesTeam.findUnique({
            where: { id: posp.asmId },
            select: { zoneId: true, regionId: true, areaId: true },
          });
          if (asm && (asm.zoneId || asm.regionId || asm.areaId)) {
            return {
              zoneId: asm.zoneId,
              regionId: asm.regionId,
              areaId: asm.areaId,
              districtId: null,
            };
          }
        }

        // Tier 3: Inherit from a DM whose areaId matches the POSP's areaId
        if (posp.areaId) {
          const dm = await this.prisma.salesTeam.findFirst({
            where: { areaId: posp.areaId, designation: 'DM' },
            select: { zoneId: true, regionId: true, areaId: true },
          });
          if (dm && (dm.zoneId || dm.regionId)) {
            return {
              zoneId: dm.zoneId,
              regionId: dm.regionId,
              areaId: posp.areaId,
              districtId: null,
            };
          }
        }
      }
    }

    // Tier 4: "Self" deal or no POSP geo found — use the creating manager's territory
    const salesTeam = await this.prisma.salesTeam.findUnique({
      where: { userId },
      select: { zoneId: true, regionId: true, areaId: true },
    });

    if (
      salesTeam &&
      (salesTeam.zoneId || salesTeam.regionId || salesTeam.areaId)
    ) {
      return {
        zoneId: salesTeam.zoneId,
        regionId: salesTeam.regionId,
        areaId: salesTeam.areaId,
        districtId: null,
      };
    }

    return NULL_GEO;
  }
}
