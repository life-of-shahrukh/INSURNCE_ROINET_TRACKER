import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CreatePayoutGridConfigDto {
  @IsIn(['ROLE', 'POSP'])
  scopeType: string;

  @IsString()
  scopeValue: string;

  @IsOptional()
  @IsString()
  insurerSlug?: string;

  @IsBoolean()
  visible: boolean;

  @IsOptional()
  @IsString()
  restrictions?: string;
}

export class UpdatePayoutGridConfigDto {
  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsString()
  restrictions?: string;
}
