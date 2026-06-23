import { z } from "zod";
import { POLICY_TYPES } from "@/lib/constants";

export const dealFormSchema = z.object({
  pospId: z.string().optional(),
  customerId: z.string().optional(),
  customer: z.string().min(2, "Customer name must be at least 2 characters"),
  policy: z.enum(POLICY_TYPES, { error: "Select a valid policy type" }),
  sum: z.coerce.number({ error: "Enter a valid amount" }).min(0, "Sum assured cannot be negative"),
  premium: z.coerce.number({ error: "Enter a valid amount" }).min(1, "Premium must be greater than 0"),
  // COA / coaType / margin are SUPER_ADMIN-only financial fields — optional in the form.
  coa: z.coerce.number({ error: "Enter a valid amount" }).min(0, "COA cannot be negative").optional(),
  coaType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  margin: z.coerce.number({ error: "Enter a valid amount" }).min(0, "Margin cannot be negative").optional(),
  status: z.enum(["H", "W", "C", "L", "D"], { error: "Select a valid status" }),
  expected: z.string().min(1, "Expected closure date is required"),
  // Proposal number: assigned by insurer on proposal form submission (before policy issuance).
  // Optional at deal creation — POSP fills it once they receive it from the insurer.
  proposal: z.string().optional(),
  // Policy number: assigned by insurer only after underwriting approval + first premium receipt.
  // Must not be required at proposal/lead stage.
  policyNo: z.string().optional(),
  // Issuance date: required when a policy number is provided.
  issued: z.string().optional(),
  remarks: z.string().optional(),

});

export type DealFormValues = z.infer<typeof dealFormSchema>;
