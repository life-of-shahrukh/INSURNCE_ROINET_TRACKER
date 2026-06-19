import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

/**
 * Query params accepted by GET /api/dashboard/stats.
 * Inherits dateRange, dateFrom, dateTo, zone, region, area, district, posp
 * from GeoFilterQueryDto.
 *
 * `subordinateLevel` + `subordinateCode` let upper-level users drill into a
 * specific team member's territory (district-based); `pospId` is the terminal
 * POSP-level drill.
 */
export class DashboardQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional({
    description:
      'Role level of the subordinate being drilled into (NATIONAL_HEAD | ZH | RH | ASM | DM)',
  })
  @IsOptional()
  @IsString()
  subordinateLevel?: string;

  @ApiPropertyOptional({
    description: 'External code of the subordinate at `subordinateLevel`',
  })
  @IsOptional()
  @IsString()
  subordinateCode?: string;

  @ApiPropertyOptional({
    description: 'Posp.id for terminal POSP-level drill-down',
  })
  @IsOptional()
  @IsString()
  pospId?: string;

  // ── Scoped geographic narrowing (intersected with the caller's scope) ────

  @ApiPropertyOptional({
    description: 'Narrow to a Cognitensor ZoneId (from ListZone)',
  })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({
    description: 'Narrow to a Cognitensor RegionId (from ListDistrict.regionid)',
  })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({
    description: 'Narrow to a single Cognitensor StateId',
  })
  @IsOptional()
  @IsString()
  stateId?: string;

  @ApiPropertyOptional({ description: 'Narrow to a single DistrictId' })
  @IsOptional()
  @IsString()
  districtId?: string;

  @ApiPropertyOptional({ description: 'Narrow to a single CityId' })
  @IsOptional()
  @IsString()
  cityId?: string;
}
