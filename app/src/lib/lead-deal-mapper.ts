import type { HeatStatus, CreateLeadInput, LeadProduct, UpdateLeadInput } from "@/lib/api/lead-api";
import type { DealStatus } from "@/lib/types";
import {
  closureTimelineToHeatStatus,
  heatStatusToClosureTimeline,
  suggestedExpectedCloseDateForTimeline,
} from "@/lib/closure-timeline";

const POLICY_TO_PRODUCT: Record<string, LeadProduct | string> = {
  Life: "LIFE",
  Health: "HEALTH",
  Motor: "MOTOR",
  Travel: "TRAVEL",
  Home: "PROPERTY",
  Marine: "MARINE",
  Term: "LIFE",
  ULIP: "LIFE",
  "Personal Loan": "COMMERCIAL",
  "Home Loan": "COMMERCIAL",
  "Business Loan": "COMMERCIAL",
};

const PRODUCT_TO_POLICY: Record<string, string> = {
  LIFE: "Life",
  HEALTH: "Health",
  MOTOR: "Motor",
  TRAVEL: "Travel",
  PROPERTY: "Home",
  MARINE: "Marine",
  COMMERCIAL: "Business Loan",
  CROP: "Life",
  ENGINEERING: "Life",
};

export function mapPolicyToProduct(policy: string): string {
  return POLICY_TO_PRODUCT[policy] ?? policy.toUpperCase().replace(/\s+/g, "_");
}

export function mapProductToPolicy(product: string): string {
  return PRODUCT_TO_POLICY[product] ?? product;
}

export interface LeadFormPayload {
  customerId: string;
  policy: string;
  sum: string;
  premium: string;
  status: DealStatus;
  expected: string;
  remarks: string;
}

function timelineFromFormStatus(status: DealStatus): ReturnType<typeof heatStatusToClosureTimeline> {
  return heatStatusToClosureTimeline(status as HeatStatus);
}

export function formToCreateLeadInput(form: LeadFormPayload): CreateLeadInput {
  const closureTimeline = timelineFromFormStatus(form.status);
  const expectedCloseDate =
    form.expected || suggestedExpectedCloseDateForTimeline(closureTimeline);

  return {
    customerId: form.customerId,
    product: mapPolicyToProduct(form.policy) as LeadProduct,
    estimatedPremium: +form.premium || 0,
    estimatedSum: +form.sum || 0,
    expectedCloseDate,
    heatStatus: closureTimelineToHeatStatus(closureTimeline),
    remarks: form.remarks.trim() || undefined,
    closureTimeline,
  };
}

export interface LeadUpdateFormPayload extends LeadFormPayload {
  proposal?: string;
  policyNo?: string;
  issued?: string;
  coa?: string;
  coaType?: "PERCENT" | "AMOUNT";
  margin?: string;
}

export function formToUpdateLeadInput(
  form: LeadUpdateFormPayload,
): UpdateLeadInput {
  const converting = !!form.policyNo?.trim();
  const policyNo = form.policyNo?.trim();
  const closureTimeline = timelineFromFormStatus(form.status);
  const expectedCloseDate =
    form.expected || suggestedExpectedCloseDateForTimeline(closureTimeline);

  return {
    customerId: form.customerId,
    product: mapPolicyToProduct(form.policy) as LeadProduct,
    estimatedPremium: +form.premium || 0,
    estimatedSum: +form.sum || 0,
    expectedCloseDate,
    remarks: form.remarks.trim() || undefined,
    ...(!converting
      ? {
          heatStatus: closureTimelineToHeatStatus(closureTimeline),
          closureTimeline,
        }
      : {}),
    ...(converting && policyNo
      ? {
          policyNo,
          proposal: form.proposal?.trim() || undefined,
          ...(form.issued ? { issued: form.issued } : {}),
          coa: form.coa !== undefined ? +form.coa || 0 : undefined,
          coaType: form.coaType,
          margin: form.margin !== undefined ? +form.margin || 0 : undefined,
        }
      : {}),
  };
}
