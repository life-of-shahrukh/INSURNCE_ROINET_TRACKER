import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class GetRedirectUriDto {
  @ApiProperty({
    description:
      'Opaque user identifier issued by the central SSO server. Will be embedded into the signed token and used to look up the user on verification.',
    example: 'CSP023057',
  })
  @IsString()
  @IsNotEmpty()
  userCode: string;

  @ApiProperty({
    description:
      'Whether the user is a POSP (CSP agent). true = POSP login via Cognitensor lookup; false = hierarchical manager login (placeholder, not yet implemented).',
    example: true,
  })
  @IsBoolean()
  isPosp: boolean;
}
