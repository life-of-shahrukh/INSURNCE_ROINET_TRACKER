import { ForbiddenException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import {
  buildCustomerScopeWhere,
  buildDealScopeWhere,
  buildLeadScopeWhere,
  type HierarchyScope,
} from './hierarchy-scope.util';

/**
 * Loads a lead only when it falls inside the caller's hierarchy scope.
 */
export async function findLeadInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<Prisma.LeadGetPayload<{ include: { customer: true } }> | null> {
  const scopeWhere = scope ? buildLeadScopeWhere(scope) : {};
  return prisma.lead.findFirst({
    where: { id, ...(scopeWhere as Prisma.LeadWhereInput) },
    include: { customer: true },
  });
}

export async function assertLeadInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<void> {
  const lead = await findLeadInScope(prisma, id, scope);
  if (!lead) {
    throw new ForbiddenException('Lead is not accessible in your territory');
  }
}

/**
 * Loads a deal only when it falls inside the caller's hierarchy scope.
 */
export async function findDealInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<Prisma.DealGetPayload<object> | null> {
  const scopeWhere = scope ? buildDealScopeWhere(scope) : {};
  return prisma.deal.findFirst({
    where: { id, ...(scopeWhere as Prisma.DealWhereInput) },
  });
}

export async function assertDealInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<void> {
  const deal = await findDealInScope(prisma, id, scope);
  if (!deal) {
    throw new ForbiddenException('Deal is not accessible in your territory');
  }
}

/**
 * Loads a customer only when linked to the caller's hierarchy scope.
 */
export async function findCustomerInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<Prisma.CustomerGetPayload<object> | null> {
  const scopeWhere = scope ? buildCustomerScopeWhere(scope) : {};
  return prisma.customer.findFirst({
    where: { id, ...scopeWhere },
  });
}

export async function assertCustomerInScope(
  prisma: PrismaService,
  id: string,
  scope?: HierarchyScope,
): Promise<void> {
  const customer = await findCustomerInScope(prisma, id, scope);
  if (!customer) {
    throw new ForbiddenException(
      'Customer is not accessible in your territory',
    );
  }
}
