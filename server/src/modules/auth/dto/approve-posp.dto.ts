import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum ApprovePospStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class ApprovePospDto {
  @ApiProperty({ enum: ApprovePospStatus })
  @IsEnum(ApprovePospStatus)
  status: ApprovePospStatus;
}
