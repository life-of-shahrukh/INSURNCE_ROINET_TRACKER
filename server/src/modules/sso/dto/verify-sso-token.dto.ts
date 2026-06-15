import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifySsoTokenDto {
  @ApiProperty({
    description: 'RSA-signed SSO token extracted from the redirect URL query param.',
    example: 'eyJhbGciOiJSUzI1NiJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
