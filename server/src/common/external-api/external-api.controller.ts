import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExternalApiService } from './external-api.service';
import { ExternalPospQueryDto } from './dto/external-posp-query.dto';
import { ExternalHierarchyQueryDto } from './dto/external-hierarchy-query.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { MinRole, Roles } from '../decorators/roles.decorator';
import { Role } from '../constants';

@ApiTags('External API')
@Controller('external')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ExternalApiController {
  constructor(private readonly externalApiService: ExternalApiService) {}

  @Get('states')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List all states from Cognitensor' })
  listStates() {
    return this.externalApiService.listStates();
  }

  @Get('districts')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List districts for a state from Cognitensor' })
  listDistricts(@Query('stateId') stateId: string) {
    return this.externalApiService.listDistricts(stateId ?? '');
  }

  @Get('cities')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List cities for a district from Cognitensor' })
  listCities(@Query('districtId') districtId: string) {
    return this.externalApiService.listCities(districtId ?? '');
  }

  @Get('district-by-id')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Look up a single district (with its stateId) by districtId' })
  async getDistrictById(@Query('districtId') districtId: string) {
    const result = await this.externalApiService.getDistrictById(districtId ?? '');
    if (!result) {
      return {};
    }
    return result;
  }

  @Get('zones')
  @Roles(
    Role.POSP,
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'List all zones from Cognitensor' })
  listZones() {
    return this.externalApiService.listZones();
  }

  @Get('hierarchy')
  @MinRole(Role.RH)
  @ApiOperation({
    summary: 'Full district → DM → ASM → ZH → NH hierarchy (RH+)',
    description:
      'All params are optional. Pass districtId, userCode, or userId to filter by a specific district manager row.',
  })
  listHierarchy(@Query() query: ExternalHierarchyQueryDto) {
    return this.externalApiService.listHierarchy(query);
  }

  @Get('posps')
  @MinRole(Role.ASM)
  @ApiOperation({
    summary: 'Paginated + filtered POSP list from Cognitensor (ASM+)',
  })
  listPosps(@Query() query: ExternalPospQueryDto) {
    return this.externalApiService.listPosps(query);
  }
}
