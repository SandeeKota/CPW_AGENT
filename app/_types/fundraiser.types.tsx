import z from "zod";
import { ProjectModal } from "./project.types";

export const FundraiserReasonEnum = z.enum([
  "Honoring a loved one",
  "Celebrating a special occasion",
  "Celebrating a festival",
  "Marking a special day of commemoration",
]);

export const FundraiserStatusEnum = z.enum([
  "active",
  "completed",
  "cancelled",
  "upcoming",
]);

export const FundraiserSchema = z
  .object({
    _id: z.string(),
    title: z.string().min(1),
    startDate: z.string().min(2),
    endDate: z.string().min(2),
    goal: z.number().min(1),
    raised: z.number().default(0),

    reason: z.string().min(1),
    customReason: z.string().optional(),

    story: z.string().min(1),
    projectId: z.string(),

    donorUpdatesVisible: z.boolean()?.optional().default(true),
    bannerImage: z.string().url().optional(),
    verixImageUrl: z.string().url().optional(),

    createdBy: z.string(),
    status: FundraiserStatusEnum.default("active"),

    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string()?.optional(),

    currency_type: z.string().optional().default("INR"),
    donors: z.array(z.object({}))?.optional(),
    ornagiser: z.object({} as any)?.optional(),

    // New Fields Student
    institution: z.string().optional(),
    studentName: z.string().min(1),
    studentProfile: z.string().optional(),
    studentBio: z.string().optional(),

    project: z.custom<Partial<ProjectModal>>().optional(),

    share_description: z.string().optional(),
    convertedAmounts: z.record(z.any()).optional(),
    shareUrl: z.string().optional(),
    user_copy: z.record(z.any()).optional(),
  })
  .strict();

export type FundraiserSchema = z.infer<typeof FundraiserSchema>;

export const FundraiserDefaultValues: FundraiserSchema = {
  _id: "", // Optional, usually undefined during create
  title: "",
  startDate: "",
  endDate: "",
  goal: 0,
  raised: 0,

  reason: "Honoring a loved one", // default enum value
  customReason: "",

  story: "",
  projectId: "",

  donorUpdatesVisible: true,
  bannerImage: "",

  createdBy: "", // can be filled from user context/session
  status: "active",

  studentName: "",

  currency_type: "INR",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const fundraiserFormSchema = z.object({
  title: z.string().min(1),
  startDate: z.string().min(2),
  endDate: z.string().min(2),
  goal: z.number().min(1),
  raised: z.number().default(0),

  reason: z.string().min(1),
  customReason: z.string().optional(),

  story: z.string().min(1),
  projectId: z.string(),

  donorUpdatesVisible: z.boolean()?.optional().default(true),
  bannerImage: z.string().optional(),

  createdBy: z.string(),
  status: FundraiserStatusEnum.default("active"),

  currency_type: z.string().default("INR").optional(),
  createdAt: z.string(),
  updatedAt: z.string(),

  // New Fields Student
  studentName: z.string().min(1),
  institution: z.string().optional(),
  studentProfile: z.string().optional(),
  studentBio: z.string().optional(),
});

export type FundraiserFormValues = z.infer<typeof fundraiserFormSchema>;
