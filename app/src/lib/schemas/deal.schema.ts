import { z } from "zod";
import { ALL_PRODUCT_LINE_VALUES } from "@/lib/filters/insurance-products";

export const dealFormSchema = z.object({
  pospId: z.string().optional(),
  customerId: z.string().optional(),
  customer: z.string().min(2, "Customer name must be at least 2 characters"),
  policy: z.string().min(1, "Select a valid product category").refine(
    (val) => ALL_PRODUCT_LINE_VALUES.includes(val),
    { message: "Select a valid product category" },
  ),
  sum: z.coerce.number({ error: "Enter a valid amount" }).min(0, "Sum assured cannot be negative"),
  premium: z.coerce.number({ error: "Enter a valid amount" }).min(1, "Premium must be greater than 0"),
  coa: z.coerce.number({ error: "Enter a valid amount" }).min(0, "COA cannot be negative").optional(),
  coaType: z.enum(["PERCENT", "AMOUNT"]).optional(),
  margin: z.coerce.number({ error: "Enter a valid amount" }).min(0, "Margin cannot be negative").optional(),
  status: z.enum(["H", "W", "C", "L", "D"], { error: "Select a valid status" }),
  expected: z.string().min(1, "Expected closure date is required"),
  proposal: z.string().optional(),
  policyNo: z.string().optional(),
  issued: z.string().optional(),
  remarks: z.string().optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;
