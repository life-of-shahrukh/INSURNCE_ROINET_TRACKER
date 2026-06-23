import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants';
import { ResolvedScope } from '../../common/decorators/scope.decorator';
import type { HierarchyScope } from '../../common/auth/hierarchy-scope.util';
import { HierarchyScopeInterceptor } from '../../common/interceptors/hierarchy-scope.interceptor';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerListQueryDto } from './dto/customer-list-query.dto';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(HierarchyScopeInterceptor)
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  findAll(
    @Query() query: CustomerListQueryDto,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.customerService.findAll(query, scope);
  }

  @Get('export')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  async exportCsv(
    @Query() query: CustomerListQueryDto,
    @Res() res: Response,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    const csv = await this.customerService.exportCsv(query, scope);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="customers.csv"',
    );
    res.send(csv);
  }

  @Get('search')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  search(@Query('q') query: string, @ResolvedScope() scope: HierarchyScope) {
    return this.customerService.search(query, scope);
  }

  @Patch(':id')
  @Roles(
    Role.DM,
    Role.ASM,
    Role.RH,
    Role.ZH,
    Role.NATIONAL_HEAD,
    Role.SUPER_ADMIN,
    Role.POSP,
  )
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @ResolvedScope() scope: HierarchyScope,
  ) {
    return this.customerService.update(id, updateCustomerDto, scope);
  }
}
