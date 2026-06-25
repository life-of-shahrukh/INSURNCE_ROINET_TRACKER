import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { Lead, Deal } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { Role } from '../../common/constants';
import { isManager } from '../../common/auth/posp-scope.util';

export interface LeadConversionPayload {
  policyNo: string;
  proposal?: string;
  issued?: Date;
  coa?: number;
  coaType?: string;
  margin?: number;
  heatStatus?: string;
}

function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `PRP-${year}-${random}`;
}

function computeCoaAmount(
  coaType: string,
  coa: number,
  premium: number,
): number {
  return coaType === 'PERCENT' ? (premium * coa) / 100 : coa;
}

function assertCanConvertLead(lead: Lead, user: AuthUser): void {
  if (user.role === Role.POSP) {
    if (!user.pospId) {
      throw new ForbiddenException('POSP account is not linked to a profile');
    }
    if (lead.pospId !== user.pospId) {
      throw new ForbiddenException("Cannot convert another POSP's lead");
    }
    return;
  }

  if (!isManager(user)) {
    throw new ForbiddenException('Insufficient permissions to convert lead');
  }
}

/**
 * Creates a Deal from a Lead when a policy number is supplied.
 */
export async function convertLeadToDeal(
  prisma: PrismaService,
  lead: Lead,
  user: AuthUser,
  payload: LeadConversionPayload,
): Promise<Deal> {
  if (!payload.policyNo?.trim()) {
    throw new BadRequestException(
      'Policy number is required to convert lead to deal',
    );
  }

  if (lead.status === 'LOST') {
    throw new BadRequestException('Cannot convert a lost lead to deal');
  }

  if (lead.convertedToDealId) {
    throw new BadRequestException('Lead already converted to deal');
  }

  assertCanConvertLead(lead, user);

  const customer = await prisma.customer.findUnique({
    where: { id: lead.customerId },
    select: { name: true },
  });

  const coaType = payload.coaType ?? 'AMOUNT';
  const coa = payload.coa ?? 0;
  const premium = lead.estimatedPremium;

  const deal = await prisma.deal.create({
    data: {
      pospId: lead.pospId,
      customerId: lead.customerId,
      customerName: customer?.name ?? '',
      policy: lead.product,
      productLine: lead.product,
      productSubType: lead.productSubType,
      sum: lead.estimatedSum ?? 0,
      premium,
      coa,
      coaType,
      coaAmount: computeCoaAmount(coaType, coa, premium),
      margin: payload.margin ?? 0,
      status: 'D',
      expected: lead.expectedCloseDate ?? new Date(),
      proposal: payload.proposal?.trim() || generateProposalNumber(),
      policyNo: payload.policyNo.trim(),
      issued: payload.issued,
      remarks: lead.remarks ?? '',
      zoneId: lead.zoneId,
      regionId: lead.regionId,
      areaId: lead.areaId,
      districtId: lead.districtId,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'WON',
      convertedToDealId: deal.id,
      convertedAt: new Date(),
    },
  });

  return deal;
}

export async function loadLeadForConversion(
  prisma: PrismaService,
  leadId: string,
): Promise<Lead> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    throw new NotFoundException(`Lead with ID ${leadId} not found`);
  }
  return lead;
}
