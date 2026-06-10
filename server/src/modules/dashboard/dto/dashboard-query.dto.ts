import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

/**
 * Query params accepted by GET /api/dashboard/stats.
 * Inherits dateRange, dateFrom, dateTo, zone, region, area, district, posp
 * from GeoFilterQueryDto — no extra fields needed for the stats endpoint.
 */
export class DashboardQueryDto extends GeoFilterQueryDto {}
