import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GeoCatalogService } from './geo-catalog.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { CityItem, DistrictItem, GeoCatalog } from './geo.types';

/**
 * Geo reference data. Small lists (zones/regions/states) come whole from
 * `/geo/catalog`; big lists are searched server-side so the client never pulls
 * ~726 districts or ~5.7k cities in bulk. Reference data, so any authenticated
 * user may read it.
 */
@ApiTags('Geo')
@Controller('geo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GeoController {
  constructor(private readonly geo: GeoCatalogService) {}

  @Get('catalog')
  @ApiOperation({
    summary: 'Small geo reference lists (zones, regions, states)',
  })
  getCatalog(): GeoCatalog {
    return this.geo.getCatalog();
  }

  @Get('districts/search')
  @ApiOperation({ summary: 'Server-side district typeahead' })
  searchDistricts(
    @Query('q') q = '',
    @Query('limit') limit = '20',
    @Query('stateId') stateId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('regionId') regionId?: string,
  ): DistrictItem[] {
    return this.geo.searchDistricts(q, this.parseLimit(limit), {
      stateId,
      zoneId,
      regionId,
    });
  }

  @Get('cities/search')
  @ApiOperation({ summary: 'Server-side city typeahead' })
  searchCities(
    @Query('q') q = '',
    @Query('limit') limit = '20',
    @Query('districtId') districtId?: string,
    @Query('stateId') stateId?: string,
  ): CityItem[] {
    return this.geo.searchCities(q, this.parseLimit(limit), {
      districtId,
      stateId,
    });
  }

  @Get('districts/by-ids')
  @ApiOperation({ summary: 'Resolve district ids to labels (for chips)' })
  districtsByIds(@Query('ids') ids = ''): DistrictItem[] {
    return this.geo.districtsByIds(this.parseIds(ids));
  }

  @Get('cities/by-ids')
  @ApiOperation({ summary: 'Resolve city ids to labels (for chips)' })
  citiesByIds(@Query('ids') ids = ''): CityItem[] {
    return this.geo.citiesByIds(this.parseIds(ids));
  }

  private parseLimit(raw: string): number {
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) return 20;
    return Math.min(n, 50);
  }

  private parseIds(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
