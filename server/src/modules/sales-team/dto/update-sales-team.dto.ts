import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesTeamDto } from './create-sales-team.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateSalesTeamDto extends PartialType(CreateSalesTeamDto) {
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
}
