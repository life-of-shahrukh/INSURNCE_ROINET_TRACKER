import type { GeoFilterQueryDto } from '../dto/geo-filter-query.dto';



export interface DateRangeBounds {

  gte?: Date;

  lte?: Date;

}



export function resolveDateRange(query: GeoFilterQueryDto): DateRangeBounds | undefined {

  const range = query.dateRange;

  if (!range || range === 'all') return undefined;



  const now = new Date();

  let from: Date | undefined;

  let to: Date | undefined;



  switch (range) {

    case 'today':

      from = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

      break;

    case 'week': {

      const day = now.getDay();

      from = new Date(now);

      from.setDate(now.getDate() - day);

      from.setHours(0, 0, 0, 0);

      to = new Date(from);

      to.setDate(from.getDate() + 6);

      to.setHours(23, 59, 59, 999);

      break;

    }

    case 'month':

      from = new Date(now.getFullYear(), now.getMonth(), 1);

      to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      break;

    case 'quarter': {

      const q = Math.floor(now.getMonth() / 3);

      from = new Date(now.getFullYear(), q * 3, 1);

      to = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59, 999);

      break;

    }

    case 'year':

      from = new Date(now.getFullYear(), 0, 1);

      to = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      break;

    case 'custom':

      from = query.dateFrom ? new Date(query.dateFrom) : undefined;

      to = query.dateTo ? new Date(query.dateTo) : undefined;

      if (to) to.setHours(23, 59, 59, 999);

      break;

    default:

      return undefined;

  }



  const bounds: DateRangeBounds = {};

  if (from) bounds.gte = from;

  if (to) bounds.lte = to;

  return Object.keys(bounds).length > 0 ? bounds : undefined;

}



export function parsePremiumRange(range: string): { gte?: number; lte?: number } | undefined {

  if (!range) return undefined;

  if (range.endsWith('+')) {

    return { gte: Number(range.slice(0, -1)) };

  }

  const [min, max] = range.split('-').map(Number);

  if (Number.isNaN(min) || Number.isNaN(max)) return undefined;

  return { gte: min, lte: max };

}



export function buildGeoFilterWhere(query: GeoFilterQueryDto): Record<string, unknown> {

  const where: Record<string, unknown> = {};

  if (query.zone?.length) where.zoneId = { in: query.zone };

  if (query.region?.length) where.regionId = { in: query.region };

  if (query.area?.length) where.areaId = { in: query.area };

  if (query.district?.length) where.districtId = { in: query.district };

  if (query.posp?.length) where.pospId = { in: query.posp };

  return where;

}



export function buildPolicyStatusWhere(

  values: string[] | undefined,

): Record<string, unknown> | undefined {

  if (!values?.length) return undefined;

  const hasIssued = values.includes('issued');

  const hasPending = values.includes('pending');

  if (hasIssued && hasPending) return undefined;

  if (hasIssued) return { issued: { not: null } };

  if (hasPending) return { issued: null };

  return undefined;

}



export function mergeWhereClauses(

  ...clauses: Array<Record<string, unknown> | undefined>

): Record<string, unknown> {

  const valid = clauses.filter(

    (c): c is Record<string, unknown> => !!c && Object.keys(c).length > 0,

  );

  if (valid.length === 0) return {};

  if (valid.length === 1) return valid[0];

  return { AND: valid };

}


