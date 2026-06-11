import { z } from "zod";

export const customerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  email: z
    .string()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address",
    }),
  alternateMobile: z
    .string()
    .refine((v) => v === "" || /^\d{10}$/.test(v), {
      message: "Alternate mobile must be exactly 10 digits",
    }),
  panNumber: z
    .string()
    .refine((v) => v === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(v), {
      message: "PAN must be in format ABCDE1234F",
    }),
  aadharNumber: z
    .string()
    .refine((v) => v === "" || /^\d{12}$/.test(v), {
      message: "Aadhar must be exactly 12 digits",
    }),
  stateId: z.string().optional(),
  stateName: z.string().optional(),
  districtId: z.string().optional(),
  districtName: z.string().optional(),
  cityId: z.string().optional(),
  cityName: z.string().optional(),
  address: z.string().optional(),
  pincode: z
    .string()
    .refine((v) => v === "" || /^\d{6}$/.test(v), {
      message: "Pincode must be exactly 6 digits",
    }),
  source: z.string().optional(),
  kycStatus: z.enum(["PENDING", "VERIFIED", "REJECTED"]),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
