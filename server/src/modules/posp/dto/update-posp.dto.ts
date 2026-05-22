import { PartialType } from '@nestjs/swagger';
import { CreatePospDto } from './create-posp.dto';

export class UpdatePospDto extends PartialType(CreatePospDto) {}
