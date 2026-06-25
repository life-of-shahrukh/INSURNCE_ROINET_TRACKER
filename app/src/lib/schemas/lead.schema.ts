import { z } from "zod";

const PRODUCT_LINES = [
  "HEALTH",
  "MOTOR",
  "LIFE",
  "TRAVEL",
  "COMMERCIAL_LINES",
  "RURAL",
  "HOME",
] as const;

export const leadFormSchema = z.object({
  customerId: z.string().min(1, "Please select a customer"),
  product: z.enum(PRODUCT_LINES, { error: "Select a valid product category" }),
  productSubType: z.string().optional(),
  estimatedPremium: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Estimated premium cannot be negative"),
  estimatedSum: z.coerce
    .number({ error: "Enter a valid amount" })
    .min(0, "Estimated sum cannot be negative"),
  closureTimeline: z.enum(["THIS_MONTH", "T_PLUS_1", "T_PLUS_2", "LATER"], {
    error: "Select a valid closure timeline",
  }),
  expectedCloseDate: z.string().optional(),
  source: z.string().optional(),
  remarks: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"], {
    error: "Select a valid status",
  }),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;
