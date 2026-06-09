import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { MinRole, Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // Any field role (DM+) and POSP can manage customers
  @Post()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  findAll() {
    return this.customerService.findAll();
  }

  @Get('search')
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  search(@Query('q') query: string) {
    return this.customerService.search(query);
  }

  @Patch(':id')
  @Roles(Role.DM, Role.ASM, Role.RH, Role.ZH, Role.NATIONAL_HEAD, Role.SUPER_ADMIN, Role.POSP)
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customerService.update(id, updateCustomerDto);
  }
}
