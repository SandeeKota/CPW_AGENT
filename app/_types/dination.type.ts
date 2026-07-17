import { z } from "zod";
import { FundraiserSchema } from "./fundraiser.types";
import { UserSchema } from "./user.type";
import { ProjectSchema } from "./project.types";

// --- User Details Schema ---
const normalizePhoneDigits = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^0+/, "");

const DonationUserDetailsBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .transform(normalizePhoneDigits),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  dial_code: z.string().min(1, "Dial code is required")?.optional(),
});

export const DonationUserDetailsSchema =
  DonationUserDetailsBaseSchema.superRefine((data, ctx) => {
    if (normalizePhoneDigits(data.phone).length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Phone number must be at least 8 digits",
        path: ["phone"],
      });
    }
  });

export type DonationUserDetails = z.infer<typeof DonationUserDetailsSchema>;

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const INDIAN_POSTAL_CODE_REGEX = /^[1-9][0-9]{5}$/;

export const DonationTaxExemptionAddressSchema = z
  .object({
    address_line: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z
      .string()
      .optional()
      .refine(
        (value) =>
          !value?.trim() || INDIAN_POSTAL_CODE_REGEX.test(value.trim()),
        "Enter a valid 6-digit postal code",
      ),
    country: z.string().optional(),
  })
  .strict();

export type DonationTaxExemptionAddress = z.infer<
  typeof DonationTaxExemptionAddressSchema
>;

export const DonationTaxExemptionDetailsSchema = z
  .object({
    name_as_per_pan: z.string().optional(),
    pan: z
      .string()
      .optional()
      .refine(
        (value) => !value?.trim() || PAN_REGEX.test(value.trim().toUpperCase()),
        "Enter a valid PAN",
      ),
    address: DonationTaxExemptionAddressSchema.optional(),
  })
  .strict();

export type DonationTaxExemptionDetails = z.infer<
  typeof DonationTaxExemptionDetailsSchema
>;

export const PanVerificationResponseSchema = z
  .object({
    success: z.boolean(),
    verified: z.boolean().optional(),
    verification: z.string().optional(),
    message: z.string().optional(),
    traceId: z.string().optional(),
    data: z
      .object({
        aadhaar_seeding_status: z.string().optional(),
        category: z.string().optional(),
        full_name: z.string().optional(),
        first_name: z.string().optional(),
        middle_name: z.string().optional(),
        last_name: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type PanVerificationResponse = z.infer<
  typeof PanVerificationResponseSchema
>;

const validateTaxExemptionDetails = (
  data: {
    tax_exemption_certificate_required?: boolean;
    tax_exemption_details?: DonationTaxExemptionDetails;
    currency?: string;
  },
  ctx: z.RefinementCtx,
) => {
  if (!data.tax_exemption_certificate_required) return;

  if ((data.currency || "INR").toUpperCase() !== "INR") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "80G tax exemption certificate is available only for INR donations",
      path: ["tax_exemption_certificate_required"],
    });
  }

  if (!data.tax_exemption_details?.pan?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PAN is required",
      path: ["tax_exemption_details", "pan"],
    });
  }

  if (!data.tax_exemption_details?.name_as_per_pan?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Name as per PAN is required",
      path: ["tax_exemption_details", "name_as_per_pan"],
    });
  }

  const addressChecks: Array<{
    key: keyof DonationTaxExemptionAddress;
    message: string;
  }> = [
    { key: "address_line", message: "Address line is required" },
    { key: "city", message: "City is required" },
    { key: "state", message: "State is required" },
    { key: "postal_code", message: "Postal code is required" },
    { key: "country", message: "Country is required" },
  ];

  addressChecks.forEach(({ key, message }) => {
    if (!data.tax_exemption_details?.address?.[key]?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["tax_exemption_details", "address", key],
      });
    }
  });
};

// --- Payment Details Schema ---
export const PaymentDetailsSchema = z.object({
  provider: z.enum(["stripe", "razorpay"]),
  stripe_payment_intent_id: z.string().optional(),
  razorpay_payment_id: z.string().optional(),
  status: z.enum(["success", "failed", "refunded", "pending"]),
  paidAt: z.string().optional(), // ISO date string
});

export const StripeInvoiceDetailSchema = z.object({
  invoice_id: z.string().optional(),
  invoice_status: z.string().optional(),
  amount_paid: z.number().optional(),
  currency: z.string().optional(),
  paid_at: z.string().optional(),
  invoice_pdf: z.string().optional(),
  hosted_invoice_url: z.string().optional(),
  is_really_paid: z.boolean().optional(),
});

// --- Donations Schema ---
export const DonationBaseSchema = z
  .object({
    _id: z.string().optional(),
    project_id: z.string().optional(),
    campaign_id: z.string().optional(),

    donationType: z.enum(["oneTime", "monthly"]),
    amount: z.number().min(1, "Donation amount required"),

    dedicated_name: z.string().optional(),
    dedicated_message: z.string().optional(),

    userDetails: DonationUserDetailsSchema,
    tax_exemption_certificate_required: z.boolean().optional(),
    tax_exemption_details: DonationTaxExemptionDetailsSchema.optional(),
    pan_verification_response: PanVerificationResponseSchema.optional(),

    createdBy: z.string().min(1, "Creator user ID is required").optional(),
    recive_updates: z.boolean().default(false),
    createdAt: z.string().min(1, "CreatedAt timestamp is required"),

    paymentDetails: PaymentDetailsSchema,

    oringinalAmount: z.number().default(0).optional(),
    currency: z.string().default("INR").optional(),
    paymentMethod: z.string().optional(),
    tax: z.string().optional(),
    fee: z.string().optional(),
    transFee: z.boolean().default(false).optional(),
    payment_recipt: z.string().optional(),
    certificate80G_recipt: z.string().optional(),
    donation_recipt: z.string().optional(),
    convertedAmounts: z.object({} as any).optional(),
    coment: z.string()?.optional(),
    subscription_id: z.string().optional(),
    subscription_status: z.string().optional(),
    payment_details: z.array(StripeInvoiceDetailSchema).optional(),
  })
  .strict();

export const DonationSchema = DonationBaseSchema.superRefine(
  validateTaxExemptionDetails,
);

export type DonationsDocs = z.infer<typeof DonationSchema>;

export const DonationsViewModal = DonationBaseSchema.extend({
  _id: z.string().optional(),
  project_Details: z.custom<Partial<ProjectSchema>>().optional(),
  fundraiserDetails: z.custom<Partial<FundraiserSchema>>().optional(),
  createdBy: z.custom<Partial<UserSchema>>().optional(),
});

export type DonationsLookupModal = z.infer<typeof DonationsViewModal>;

export interface UserBadgesVerix {
  _id?: string;
  user_id?: string;
  fundraiser?: {
    id: string;
    status: "created" | "completed";
    verixImageUrl: string;
    dbImageUrl: string;
    group_id: string;
    group_title: string;
    fundraiser_createdAt?: string;
    fundraiser_completedAt?: string;
  };
  donation?: {
    id: string;
    donationType: "monthly" | "oneTime";
    verixImageUrl: string;
    dbImageUrl: string;
    group_id: string;
    group_title: string;
    amount: number;
    currency_type: string;
    donation_createdAt: string;
  };
  createdAt: string;
}
