import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { GeoFilterQueryDto } from '../../../common/dto/geo-filter-query.dto';

export class SalesTeamListQueryDto extends GeoFilterQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  territory?: string;
}
