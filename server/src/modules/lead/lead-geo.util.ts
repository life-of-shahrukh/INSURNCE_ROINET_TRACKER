import type { PrismaService } from '../../prisma/prisma.service';

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

/**
 * Resolves geo scope for a new lead using the same fallback chain as deals.
 */
export async function resolveLeadGeo(
  prisma: PrismaService,
  pospId: string | null,
  userId: string,
): Promise<GeoFields> {
  if (pospId) {
    const posp = await prisma.posp.findUnique({
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
      if (posp.zoneId || posp.regionId || posp.areaId || posp.districtId) {
        return {
          zoneId: posp.zoneId,
          regionId: posp.regionId,
          areaId: posp.areaId,
          districtId: posp.districtId,
        };
      }

      if (posp.asmId) {
        const asm = await prisma.salesTeam.findUnique({
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

      if (posp.areaId) {
        const dm = await prisma.salesTeam.findFirst({
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

  const salesTeam = await prisma.salesTeam.findUnique({
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
