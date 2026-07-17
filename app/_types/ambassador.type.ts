import { z } from "zod";

export const ambassadorPhoneRegex = /^\+\d{1,4}\d{6,14}$/;

export const ambassadorApplySchema = z.object({
  full_name: z.string().min(1, "Full name is required").trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(254, "Email must not exceed 254 characters")
    .trim()
    .toLowerCase(),
  organization: z.string().trim().optional(),
  city: z.string().min(1, "City is required").trim(),
  country: z.string().min(1, "Country is required").trim(),
  phone_number: z
    .string()
    .min(1, "Phone number is required")
    .regex(
      ambassadorPhoneRegex,
      "Phone number must include a valid country code (e.g. +919876543210)",
    )
    .trim(),
  contribution_preference: z.string().trim().optional(),
  motivation: z
    .string()
    .min(1, "Motivation is required")
    .max(20000, "Motivation must not exceed 20000 characters")
    .trim(),
});

export const ambassadorStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
]);

export const ambassadorSchema = ambassadorApplySchema.extend({
  _id: z.any().optional(),
  status: ambassadorStatusSchema.default("pending"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const ambassadorUpdateSchema = ambassadorApplySchema
  .partial()
  .extend({ status: ambassadorStatusSchema.optional() });

export type AmbassadorStatus = z.infer<typeof ambassadorStatusSchema>;
export type Ambassador = z.infer<typeof ambassadorSchema>;
export type AmbassadorApplyInput = z.infer<typeof ambassadorApplySchema>;
export type AmbassadorUpdateInput = z.infer<typeof ambassadorUpdateSchema>;

export interface AmbassadorPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AmbassadorListResult {
  data: Ambassador[];
  pagination: AmbassadorPagination;
}
