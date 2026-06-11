import { z } from "zod";

export const pospFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  code: z.string().min(2, "POSP code must be at least 2 characters"),
  mobile: z
    .string()
    .refine((v) => v === "" || /^\d{10}$/.test(v), {
      message: "Mobile must be exactly 10 digits",
    }),
  email: z
    .string()
    .refine((v) => v === "" || z.string().email().safeParse(v).success, {
      message: "Enter a valid email address",
    }),
  joined: z.string().min(1, "Joining date is required"),
  active: z.enum(["true", "false"]),
});

export type PospFormValues = z.infer<typeof pospFormSchema>;
