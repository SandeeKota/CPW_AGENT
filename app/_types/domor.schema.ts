import { z } from "zod";
import { DonationsDocs } from "./dination.type";

// --- Donor Schema ---
export const DonarSchema = z
  .object({
    _id: z.string().optional(),
    donationIds: z
      .array(z.string())
      .min(1, "At least one donation ID is required"),

    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    name: z.string().min(1, "Full name is required"),

    email: z.string().email("Valid email is required"),

    phone: z
      .string()
      .min(10, { message: "Phone number must be at least 10 digits" })
      .optional(),

    isAuthorisedUser: z.boolean().default(false),

    createdBy: z.string().optional(),
    createdAt: z.string().optional(),

    one_time_donor: z.enum(["yes", "no"]).default("no").optional(),

    donations: z.custom<DonationsDocs[]>().optional(),
    totalCampaign: z.number().default(0).optional(),
    totalRaisedAmount: z.number().default(0).optional(),
    totalRaisedByFundtaiser: z.number().default(0).optional(),
    dial_code: z.string().min(1, "Dial code is required").optional(),
  })
  .strict();

export type DonarDocs = z.infer<typeof DonarSchema>;
