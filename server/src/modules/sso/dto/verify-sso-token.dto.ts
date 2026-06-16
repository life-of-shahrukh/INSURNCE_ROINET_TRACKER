import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class VerifySsoTokenDto {
  @ApiProperty({
    description:
      'RSA-signed SSO token extracted from the redirect URL query param.',
    example: 'eyJhbGciOiJSUzI1NiJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description:
      'Whether the user is a POSP. Read by the frontend from the redirect URI query param (&isPosp=true) and forwarded here.',
    example: true,
  })
  @IsBoolean()
  isPosp: boolean;
}
