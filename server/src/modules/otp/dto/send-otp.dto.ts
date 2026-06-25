import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @IsString()
  @Matches(/^\d{10}$/, { message: 'mobile must be a 10-digit number' })
  mobile!: string;
}
