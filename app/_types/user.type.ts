import z from "zod";

export const UserSchema = z.object({
  _id: z.string().optional(),
  sub: z.string(), // Unique Auth0 or Google identifier
  email: z.string().email(),
  email_verified: z.boolean()?.optional(),
  name: z.string(),
  nickname: z.string()?.optional(),
  picture: z.string().url()?.optional(),
  updated_at: z.string().datetime()?.optional(),

  // Optional fields (may or may not exist)
  isAdminMode: z.boolean().optional(),
  given_name: z.string()?.optional(),
  family_name: z.string()?.optional(),
  createdAt: z.string().optional()?.optional(),
  role: z
    .enum(["admin", "fundraiser", "user", "ca", "super_admin"])
    .default("user")
    .optional(),
  phone: z.string().optional(),
  dial_code: z.string().optional(),
  password: z.string().optional(),
  isTestUser: z.boolean().optional(),

  user_status: z
    .enum(["active", "inactive", "block"])
    .default("active")
    .optional(),
});

export type UserSchema = z.infer<typeof UserSchema>;
