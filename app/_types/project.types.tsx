import { z } from "zod";

export const ProjectStatusEnum = z.enum([
  "active",
  "completed",
  "ongoing",
  "cancelled",
]);
export type ProjectStatusType = z.infer<typeof ProjectStatusEnum>;
export const ProjectStatusArray = ["active", "completed"];

const requiredText = (label: string) =>
  z.string().trim().min(1, `${label} is required.`);

const optionalText = () => z.string().trim().optional();

const optionalDateString = () =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid date.",
    })
    .optional();

const requiredUrl = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .url(`Enter a valid ${label.toLowerCase()}.`);

const numericText = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine(
      (value) => {
        const normalized = value.replace(/\s+/g, "");
        const numericPortion = normalized.replace(/^(<=|>=|<|>)/, "");
        return (
          numericPortion.length > 0 && !Number.isNaN(Number(numericPortion))
        );
      },
      {
        message: `${label} must be a valid number.`,
      },
    );

export const WaterQualitySchema = z.object({
  collectionDate: optionalDateString(),
  phLevel: numericText("pH level"),
  totalDissolvedSolids: numericText("TDS"),
  turbidityLevel: numericText("Turbidity"),
  totalHardness: numericText("Total hardness"),
  calciumContent: numericText("Calcium"),
  magnesiumContent: numericText("Magnesium"),
  sodiumContent: numericText("Sodium"),
  potassiumContent: numericText("Potassium"),
  chlorideLevel: numericText("Chloride"),
  fluorideLevel: numericText("Fluoride"),
  arsenicLevel: numericText("Arsenic"),
  ironContent: numericText("Iron").default(""),
  zincContent: numericText("Zinc").default(""),
  manganeseContent: numericText("Manganese").default(""),
  totalColiformBacteria: z
    .enum(["Present", "Absent"])
    .describe("Present or Absent")
    .default("Absent"),
});

export const ProjectSchema = z
  .object({
    _id: z.string().optional(),
    title: optionalText(),

    description: z
      .string()
      .trim()
      .min(20, "Description must be at least 20 characters."),

    bannerImageUrl: requiredUrl("Banner image URL"),

    schoolName: optionalText(),

    amountRaised: z.number().min(0).default(0).optional(),

    totalProjectCost: z.number().min(1, "Project cost must be greater than 0."),

    address: z.object({
      villageName: requiredText("Village"),
      mandalName: requiredText("Mandal"),
      districtName: requiredText("District"),
      stateName: requiredText("State"),
      postalCode: z
        .string()
        .trim()
        .refine((value) => value === "" || /^\d{6}$/.test(value), {
          message: "Pincode must be exactly 6 digits.",
        })
        .optional(),
      countryName: requiredText("Country"),
    }),

    locationUrl: requiredUrl("Location URL"),

    studentCount: z
      .object({
        boys: z.number().min(0).optional(),
        girls: z.number().min(0).optional(),
        total: z.number().min(1, "Total students must be greater than 0."),
      })
      .optional(),

    numberOfClasses: z.number().min(0).optional(),

    academicYear: optionalDateString(),

    waterQualityData: WaterQualitySchema,

    waterQualityPercentages: z.object({}).optional(),

    udiseCode: optionalText(),

    projectStartDate: optionalDateString(),

    projectEndDate: optionalDateString(),

    createdByUserId: optionalText(),

    projectStatus: ProjectStatusEnum.default("active"),

    isPaymentRequired: z.boolean().default(false),

    curency_type: requiredText("Currency").default("INR"),

    convertedAmounts: z.record(z.number()).optional(),

    createdAt: optionalDateString().default(new Date().toISOString()),

    updatedAt: optionalDateString(),

    location: z
      .object({
        lat: z.number().optional(),
        long: z.number().optional(),
        state: z.string().optional(),
      })
      .nullable()
      .optional(),

    stateLocation: z
      .object({
        lat: z.number().optional(),
        long: z.number().optional(),
        state: z.string().optional(),
      })
      .nullable()
      .optional(),

    state: z.string().optional(),

    State: z.string().optional(),

    user_copy: z.record(z.any()).optional(),

    center_type: z.enum(["village", "school"]).default("school"),

    population: z
      .object({
        total: z
          .number()
          .min(1, "Total population must be greater than 0.")
          .optional(),
        male: z.number().min(0).optional(),
        female: z.number().min(0).optional(),
        children: z.number().min(0).optional(),
        adults: z.number().min(0).optional(),
      })
      .optional(),

    donors: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.center_type === "school") {
      if (!data.schoolName?.trim()) {
        ctx.addIssue({
          path: ["schoolName"],
          code: z.ZodIssueCode.custom,
          message: "School name is required.",
        });
      }

      if (!data.studentCount) {
        ctx.addIssue({
          path: ["studentCount"],
          code: z.ZodIssueCode.custom,
          message: "Student strength is required.",
        });
      }

      if (data.numberOfClasses === undefined) {
        ctx.addIssue({
          path: ["numberOfClasses"],
          code: z.ZodIssueCode.custom,
          message: "Number of classrooms is required.",
        });
      }

      if (!data.academicYear?.trim()) {
        ctx.addIssue({
          path: ["academicYear"],
          code: z.ZodIssueCode.custom,
          message: "Academic year is required.",
        });
      }

      if (!data.udiseCode?.trim()) {
        ctx.addIssue({
          path: ["udiseCode"],
          code: z.ZodIssueCode.custom,
          message: "UDISE code is required.",
        });
      }

      if (data.studentCount) {
        const boys = data.studentCount.boys || 0;
        const girls = data.studentCount.girls || 0;
        const total = data.studentCount.total || 0;

        if (total < boys + girls) {
          ctx.addIssue({
            path: ["studentCount", "total"],
            code: z.ZodIssueCode.custom,
            message: "Total students cannot be less than boys + girls.",
          });
        }
      }
    }

    if (data.center_type === "village") {
      if (!data.population) {
        ctx.addIssue({
          path: ["population"],
          code: z.ZodIssueCode.custom,
          message: "Population is required.",
        });
      }

      if (data.population) {
        const male = data.population.male || 0;
        const female = data.population.female || 0;
        const children = data.population.children || 0;
        const adults = data.population.adults || 0;
        const total = data.population.total || 0;

        if (total < male + female + children + adults) {
          ctx.addIssue({
            path: ["population", "total"],
            code: z.ZodIssueCode.custom,
            message:
              "Total population cannot be less than the detailed counts.",
          });
        }
      }
    }

    if (data.projectStartDate && data.projectEndDate) {
      const startDate = new Date(data.projectStartDate);
      const endDate = new Date(data.projectEndDate);

      if (startDate > endDate) {
        ctx.addIssue({
          path: ["projectEndDate"],
          code: z.ZodIssueCode.custom,
          message: "Project end date must be after the start date.",
        });
      }
    }
  });

export type ProjectSchema = z.infer<typeof ProjectSchema>;

export type ProjectModal = z.infer<typeof ProjectSchema>;

export const ExpectedRanges: Record<
  keyof z.infer<typeof WaterQualitySchema>,
  { min: number; max: number } | null
> = {
  collectionDate: null, // Not used in calculation
  phLevel: { min: 6.5, max: 8.5 },
  totalDissolvedSolids: { min: 0, max: 500 },
  turbidityLevel: { min: 0, max: 5 },
  totalHardness: { min: 0, max: 200 },
  calciumContent: { min: 0, max: 75 },
  magnesiumContent: { min: 0, max: 30 },
  sodiumContent: { min: 0, max: 200 },
  potassiumContent: { min: 0, max: 12 },
  chlorideLevel: { min: 0, max: 250 },
  fluorideLevel: { min: 0, max: 1.0 },
  arsenicLevel: { min: 0, max: 0.01 },
  ironContent: { min: 0, max: 0.3 },
  zincContent: { min: 0, max: 5 },
  manganeseContent: { min: 0, max: 0.1 },
  totalColiformBacteria: null, // Categorical
};

export type WaterQualityScore = {
  passed: number;
  percentage: number;
  score: number;
};

const getCurrentIsoDate = () => new Date().toISOString();

export const CalculateWaterQualityData = (
  record: z.infer<typeof WaterQualitySchema>,
): WaterQualityScore => {
  let totalChecked = 0;
  let withinRange = 0;

  if (!record) {
    return {
      passed: 0,
      percentage: 0,
      score: 0,
    };
  }

  for (const key in ExpectedRanges) {
    const range = ExpectedRanges[key as keyof typeof ExpectedRanges];
    const value = record[key as keyof typeof record];

    if (range && typeof value === "number") {
      totalChecked++;
      if (value >= range.min && value <= range.max) {
        withinRange++;
      }
    }
  }

  const percentage = totalChecked > 0 ? (withinRange / totalChecked) * 100 : 0;
  const passed = withinRange === totalChecked ? 1 : 0;

  return {
    passed,
    percentage: parseFloat(percentage.toFixed(2)),
    score: withinRange,
  };
};

export const ProjectFormValues: ProjectSchema = {
  _id: "",
  title: "",
  description: "",
  bannerImageUrl: "",
  schoolName: "",
  amountRaised: 0,
  address: {
    villageName: "",
    mandalName: "",
    districtName: "",
    stateName: "",
    postalCode: "",
    countryName: "",
  },
  locationUrl: "",
  studentCount: {
    boys: 0,
    girls: 0,
    total: 0,
  },
  numberOfClasses: 0,
  academicYear: "",
  waterQualityData: {
    collectionDate: "",
    phLevel: "",
    totalDissolvedSolids: "",
    turbidityLevel: "",
    totalHardness: "",
    calciumContent: "",
    magnesiumContent: "",
    sodiumContent: "",
    potassiumContent: "",
    chlorideLevel: "",
    fluorideLevel: "",
    arsenicLevel: "",
    ironContent: "",
    zincContent: "",
    manganeseContent: "",
    totalColiformBacteria: "Absent",
  },
  waterQualityPercentages: {},
  udiseCode: "",
  totalProjectCost: 0,
  projectStartDate: getCurrentIsoDate(),
  projectEndDate: undefined,
  createdByUserId: "",
  projectStatus: "active",
  isPaymentRequired: true,
  curency_type: "INR",
  createdAt: getCurrentIsoDate(),
  updatedAt: getCurrentIsoDate(),
  center_type: "school",
  population: undefined,
  donors: [],
};

export const ProjectDefaultGoalAmounts = {
  INR: 500000,
  USD: 5000,
  EUR: 5000,
  GBP: 5000,
};
