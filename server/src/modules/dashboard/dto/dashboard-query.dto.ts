import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

/**
 * Query params accepted by GET /api/dashboard/stats.
 * Inherits dateRange, dateFrom, dateTo, zone, region, area, district, posp
 * from GeoFilterQueryDto.
 *
 * `subordinateId` is an optional SalesTeam.id that allows upper-level users
 * to drill into a specific team member's territory.
 */
export class DashboardQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({
    description: 'SalesTeam.id of a subordinate to drill into',
  })
  @IsOptional()
  @IsString()
  subordinateId?: string;
}
