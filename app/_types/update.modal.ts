import { z } from "zod";
export const UpdateSchema = z.object({
  _id: z.string().optional(),
  content: z.string().min(1),
  createdBy: z.string().min(6, { message: "User id is required" }),
  targetType: z.custom<UpdateTargetEnumType>(),
  targetId: z.string().min(6, { message: "Target id is required" }),
  createdAt: z.string(),
  updatedAt: z.string()?.optional(),
  donarId: z.string()?.optional(),

  user: z
    .object({
      _id: z.string()?.optional(),
      name: z.string(),
      email: z.string(),
      picture: z.string()?.optional(),
    })
    .optional(),
});

const UpdateTargetEnum = z.enum(["project", "fundraiser"]);

export type UpdateTargetEnumType = z.infer<typeof UpdateTargetEnum>;

export type UpdatesModal = z.infer<typeof UpdateSchema>;
