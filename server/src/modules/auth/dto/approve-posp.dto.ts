import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { UserStatus } from '@prisma/client';

export enum ApprovePospStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class ApprovePospDto {
  @ApiProperty({ enum: ApprovePospStatus })
  @IsEnum(ApprovePospStatus)
  status: ApprovePospStatus;
}
