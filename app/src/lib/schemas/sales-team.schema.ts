import { z } from "zod";

const DESIGNATIONS = ["ASM", "ZH", "RH", "SM", "TL", "AGENT"] as const;

export const salesTeamFormSchema = z.object({
  userId: z.string().optional(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  employeeCode: z.string().min(1, "Employee code is required"),
  designation: z.enum(DESIGNATIONS, { error: "Select a valid designation" }),
  managerId: z.string().optional(),
  territory: z.string().optional(),
  mobile: z
    .string()
    .regex(/^\d{10}$/, "Mobile must be exactly 10 digits"),
  email: z.string().email("Enter a valid email address"),
  joiningDate: z.string().min(1, "Joining date is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"], {
    error: "Select a valid status",
  }),
});

export type SalesTeamFormValues = z.infer<typeof salesTeamFormSchema>;
