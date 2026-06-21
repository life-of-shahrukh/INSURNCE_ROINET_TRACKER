import type { Prisma } from '@prisma/client';
import type { PospListQueryDto } from './dto/posp-list-query.dto';
import { mergeWhereClauses } from '../../common/utils/filter.util';

/**
 * Geo filters for the Posp model — uses POSP denormalized columns (`id`, `cityId`,
 * `stateId`, `districtId`) instead of deal-style `pospId`.
 */
export function buildPospGeoFilterWhere(
  query: PospListQueryDto,
  districtIds?: string[] | null,
): Prisma.PospWhereInput {
  const clauses: Prisma.PospWhereInput[] = [];

  if (query.posp?.length) {
    clauses.push({ id: { in: query.posp } });
  }

  if (query.area?.length) {
    clauses.push({ areaId: { in: query.area } });
  }

  const cityIds = new Set(query.city ?? []);
  if (query.cityId) cityIds.add(query.cityId);
  if (cityIds.size > 0) {
    clauses.push({ cityId: { in: [...cityIds] } });
  }

  const stateIds = new Set(query.state ?? []);
  if (query.stateId) stateIds.add(query.stateId);
  const stateIdList = [...stateIds];

  if (query.district?.length) {
    clauses.push({ districtId: { in: query.district } });
  } else if (districtIds !== undefined && districtIds !== null) {
    if (stateIdList.length > 0 && cityIds.size === 0) {
      clauses.push({
        OR: [
          { districtId: { in: districtIds } },
          {
            districtId: null,
            stateId: { in: stateIdList },
          },
        ],
      });
    } else {
      clauses.push({ districtId: { in: districtIds } });
    }
  }

  return mergeWhereClauses(...clauses) as Prisma.PospWhereInput;
}
