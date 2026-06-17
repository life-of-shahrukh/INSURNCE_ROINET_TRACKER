import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ExternalHierarchyQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by DistrictId. Passed directly to Cognitensor ListHierarchyUserData.',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  districtId?: number;

  @ApiPropertyOptional({
    description:
      'Filter by UserCode (District Manager code). Passed directly to Cognitensor.',
    example: 'RAKESH.GADDAM CH TEL',
  })
  @IsOptional()
  @IsString()
  userCode?: string;

  @ApiPropertyOptional({
    description:
      'Filter by UserId (District Manager user ID). Passed directly to Cognitensor.',
    example: 618469,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}
