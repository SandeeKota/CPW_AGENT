import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ChevronDown, Upload, X } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { fileService } from "@/app/utils/fileSevice";
import Image from "next/image";
import { useAppSelector } from "@/app/lib/redox/hooks";
import {
  ProjectDefaultGoalAmounts,
  ProjectFormValues,
  ProjectModal,
  ProjectSchema,
  ProjectStatusArray,
} from "@/app/_types/project.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { createProject, updateProject } from "@/app/_services/project.services";
import { useProjectsHook } from "@/app/lib/storeHooks/useProjects";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { IMAGE_LINKS } from "@/lib/images";
import { MonthPicker } from "../monthpicket";
import { useAuthStore } from "@/app/stores/authStore";
import { YearOnlyPicker } from "../YearOnlyPicker";
import { coverFormatedCurrency } from "@/lib/convertToSubcurrency";
import { AlertTitle } from "@/app/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import type { FieldErrors } from "react-hook-form";

const DEFAULT_IMAGE =
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6277_11zon_1749618412588-1756100054855.jpg";
const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"] as const;
const SCHOOL_PROJECT_COST = 500000;
const VILLAGE_PROJECT_COST = 1800000;
const TAB_ORDER = ["step1", "step2", "step3", "step4", "step5"] as const;
const STEP_LABELS: Record<(typeof TAB_ORDER)[number], string> = {
  step1: "Type, Goal, Status, About",
  step2: "School or Village details",
  step3: "Population or Student strength",
  step4: "Address and Location URL",
  step5: "Water quality",
};

type ProjectModalProps = {
  children: React.ReactNode;
  onSuccess?: (data: ProjectModal) => void;
  onFail?: (data: ProjectModal) => void;
  isEdited?: boolean;
  project?: ProjectModal;
};

const CreateProjectModal: React.FC<ProjectModalProps> = ({
  children,
  onSuccess,
  onFail,
  isEdited = false,
  project,
}) => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [openYearOnly, setYearOnlypicker] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadImages, setLoadImages] = useState<boolean>(false);
  const { addProject, updateProject: updateProjectInProjects } =
    useProjectsHook();
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [selectedBannerFile, setSelectedBannerFile] = useState<File | null>(
    null,
  );
  const [bannerPreviewUrl, setBannerPreviewUrl] = useState<string>("");
  const [activeFormTab, setActiveFormTab] = useState<string>("step1");
  const {
    formState: { errors, isValid },
    getValues,
    setValue,
    control,
    reset,
    watch,
    trigger,
    handleSubmit,
  } = useForm<ProjectSchema>({
    resolver: zodResolver(ProjectSchema),
    defaultValues: {
      ...ProjectFormValues,
    },
    mode: "onChange",
  });
  const activeCurrency =
    (isEdited ? project?.curency_type : selectedCurrency) || "INR";
  const selectedFormCurrency = watch("curency_type");
  const displayCurrency = selectedFormCurrency || activeCurrency;
  const centerType = watch("center_type") || project?.center_type || "school";
  const currentStepIndex = Math.max(
    TAB_ORDER.indexOf(activeFormTab as (typeof TAB_ORDER)[number]),
    0,
  );

  const goToNextTab = () => {
    const currentIndex = TAB_ORDER.indexOf(
      activeFormTab as (typeof TAB_ORDER)[number],
    );
    if (currentIndex >= 0 && currentIndex < TAB_ORDER.length - 1) {
      setActiveFormTab(TAB_ORDER[currentIndex + 1]);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = TAB_ORDER.indexOf(
      activeFormTab as (typeof TAB_ORDER)[number],
    );
    if (currentIndex > 0) {
      setActiveFormTab(TAB_ORDER[currentIndex - 1]);
    }
  };

  const getTabForErrorPath = (path: string): (typeof TAB_ORDER)[number] => {
    if (path.startsWith("waterQualityData")) return "step5";
    if (path.startsWith("address") || path.startsWith("locationUrl"))
      return "step4";
    if (path.startsWith("studentCount") || path.startsWith("population"))
      return "step3";
    if (
      path.startsWith("schoolName") ||
      path.startsWith("udiseCode") ||
      path.startsWith("academicYear") ||
      path.startsWith("numberOfClasses") ||
      path.startsWith("title")
    ) {
      return "step2";
    }
    return "step1";
  };

  const toDigitString = (value: string, maxLength: number) =>
    value.replace(/\D/g, "").slice(0, maxLength);

  const toNumberValue = (value: string) => (value === "" ? 0 : Number(value));

  const updateStudentCount = (
    field: "boys" | "girls",
    rawValue: string,
    onChange: (value: number) => void,
  ) => {
    const sanitized = toDigitString(rawValue, 3);
    const nextValue = toNumberValue(sanitized);
    const boys =
      field === "boys"
        ? nextValue
        : Number(getValues("studentCount.boys") || 0);
    const girls =
      field === "girls"
        ? nextValue
        : Number(getValues("studentCount.girls") || 0);

    onChange(nextValue);
    setValue("studentCount.total", boys + girls, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updateTotalStudents = (
    rawValue: string,
    onChange: (value: number) => void,
  ) => {
    const sanitized = toDigitString(rawValue, 3);
    const nextValue = toNumberValue(sanitized);
    const minimumTotal =
      Number(getValues("studentCount.boys") || 0) +
      Number(getValues("studentCount.girls") || 0);

    onChange(Math.max(nextValue, minimumTotal));
  };

  const updateProjectCost = (
    rawValue: string,
    onChange: (value: number) => void,
  ) => {
    const sanitized = rawValue.replace(/[^\d]/g, "");
    const nextValue = sanitized === "" ? 0 : Number(sanitized);
    onChange(nextValue);
  };

  const getProjectCostByCenterType = (type?: string) => {
    if (type === "village") return VILLAGE_PROJECT_COST;
    return SCHOOL_PROJECT_COST;
  };

  const updatePopulationCount = (
    field: "male" | "female" | "children" | "adults",
    rawValue: string,
    onChange: (value: number) => void,
  ) => {
    const sanitized = toDigitString(rawValue, 6);
    const nextValue = toNumberValue(sanitized);
    const totalWithoutField =
      Number(getValues("population.total") || 0) -
      Number(getValues(`population.${field}`) || 0);

    onChange(nextValue);
    setValue("population.total", Math.max(totalWithoutField + nextValue, 0), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const updatePopulationTotal = (
    rawValue: string,
    onChange: (value: number) => void,
  ) => {
    const sanitized = toDigitString(rawValue, 6);
    const nextValue = toNumberValue(sanitized);
    const minimumTotal =
      Number(getValues("population.male") || 0) +
      Number(getValues("population.female") || 0) +
      Number(getValues("population.children") || 0) +
      Number(getValues("population.adults") || 0);

    onChange(Math.max(nextValue, minimumTotal));
  };

  const sanitizeProjectPayload = (data: ProjectSchema): ProjectSchema => {
    const payload: any = {
      ...data,
      address: {
        ...data.address,
        postalCode: data.address?.postalCode?.trim() || undefined,
      },
      title: data.title?.trim() || undefined,
      schoolName: data.schoolName?.trim() || undefined,
      academicYear: data.academicYear?.trim() || undefined,
      udiseCode: data.udiseCode?.trim() || undefined,
      projectStartDate: data.projectStartDate?.trim() || undefined,
      projectEndDate: data.projectEndDate?.trim() || undefined,
      updatedAt: data.updatedAt?.trim() || undefined,
    };

    if ((payload.center_type || project?.center_type) === "village") {
      payload.center_type = "village";
      delete payload.schoolName;
      delete payload.studentCount;
      delete payload.numberOfClasses;
      delete payload.academicYear;
      delete payload.udiseCode;
    }

    if ((payload.center_type || project?.center_type) === "school") {
      payload.center_type = "school";
      delete payload.population;
    }

    return payload;
  };

  useEffect(() => {
    if (!isEdited && open) {
      const defaultAmount = getProjectCostByCenterType(centerType);

      setTimeout(() => {
        setValue("totalProjectCost", defaultAmount, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }, 100);
    }
  }, [open, selectedCurrency, isEdited, centerType, setValue]);

  const handleSubmitForm = async (data: ProjectSchema) => {
    try {
      setIsLoading(true);

      const preparedData: ProjectSchema = {
        ...data,
        curency_type: data.curency_type || activeCurrency,
        createdByUserId: data.createdByUserId || user?._id || "",
      };

      if (selectedBannerFile) {
        setImageLoading(true);
        const uploadResponse = await fileService.uploadImage(
          selectedBannerFile,
          "project",
          "project-banner",
        );
        if (!uploadResponse?.file_key) {
          throw new Error("Failed to upload banner image.");
        }
        const signedUrl = await fileService.getPreviewSignedUrl(
          uploadResponse.file_key,
        );
        if (!signedUrl) {
          throw new Error("Failed to fetch uploaded banner image URL.");
        }
        preparedData.bannerImageUrl = signedUrl;
        setValue("bannerImageUrl", signedUrl, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setSelectedBannerFile(null);
        setBannerPreviewUrl("");
        setImageLoading(false);
      }

      const payload = sanitizeProjectPayload(preparedData);
      const parsedData = ProjectSchema.safeParse(payload);

      if (!parsedData.success) {
        await trigger();
        const firstIssuePath =
          parsedData.error?.issues?.[0]?.path?.join(".") || "";
        if (firstIssuePath) {
          setActiveFormTab(getTabForErrorPath(firstIssuePath));
        }
        console.log(parsedData.error?.flatten());
        return null;
      }
      if (!parsedData.data) return null;

      if (!isEdited) {
        const response: any = await createProject(parsedData.data);
        if (response) {
          setOpen(false);
          await addProject(response);
          onSuccess && onSuccess(response);
          toast({
            variant: "default",
            title: "successfully",
            description: "Project created successfully",
          });
          router.replace(`/dashboard/centers/${response?._id}`);
        } else {
          toast({
            variant: "destructive",
            title: "failed",
            description: "Failed to create project",
          });
        }
      }

      if (isEdited) {
        const response: any = await updateProject(
          parsedData.data,
          project?._id || "",
        );
        if (response) {
          setOpen(false);
          await updateProjectInProjects(parsedData.data);
          onSuccess && onSuccess({ ...parsedData.data, _id: project?._id });
          toast({
            variant: "default",
            title: "successfully",
            description: "Project updated successfully",
          });
          router.replace(`/dashboard/centers/${project?._id}`);
        } else {
          toast({
            variant: "destructive",
            title: "failed",
            description: "Failed to update project",
          });
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Request failed",
        description:
          error?.message ||
          "Something went wrong while saving. Please try again.",
      });
    } finally {
      setImageLoading(false);
      setIsLoading(false);
    }
  };

  const handleInvalidSubmit = async () => {
    await trigger();
    const parsedData = ProjectSchema.safeParse(
      sanitizeProjectPayload({
        ...getValues(),
        curency_type: getValues("curency_type") || activeCurrency,
        createdByUserId: getValues("createdByUserId") || user?._id || "",
      }),
    );
    const firstError = parsedData.success ? null : parsedData.error.issues[0];
    if (firstError?.path?.length) {
      setActiveFormTab(getTabForErrorPath(firstError.path.join(".")));
    }
    // toast({
    //     variant: "destructive",
    //     title: "Form is incomplete",
    //     description: firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Review the highlighted fields and try again.",
    // });
  };

  useEffect(() => {
    if (open) {
      setValue("createdByUserId", user?._id || "");
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setActiveFormTab("step1");
    }
  }, [open]);

  useEffect(() => {
    if (open && !isEdited) {
      if (bannerPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
      setBannerPreviewUrl("");
      setSelectedBannerFile(null);
      reset({
        ...ProjectFormValues,
        createdByUserId: user?._id || "",
        curency_type: activeCurrency,
        projectStartDate: new Date().toISOString(),
        projectEndDate: undefined,
      });
    }
  }, [open, isEdited, reset, user?._id, activeCurrency]);

  useEffect(() => {
    if ((centerType || project?.center_type) === "village") {
      setValue("schoolName", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue("udiseCode", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue("academicYear", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue("numberOfClasses", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
      setValue("studentCount", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    if ((centerType || project?.center_type) === "school") {
      setValue("population", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [centerType, project?.center_type, setValue]);

  const checkIsValidForm = () => {
    const data = getValues();
    const isValid = ProjectSchema.safeParse(data);
    return isValid.success;
  };

  useEffect(() => {
    if (isEdited && project && project !== undefined) {
      const defaultStudentCount = ProjectFormValues.studentCount ?? {
        boys: 0,
        girls: 0,
        total: 0,
      };
      const defaultPopulation = ProjectFormValues.population ?? {
        total: 0,
        male: 0,
        female: 0,
        children: 0,
        adults: 0,
      };
      const filteredProject: Partial<ProjectModal> = {
        ...ProjectFormValues,
        ...project,
        address: {
          ...ProjectFormValues.address,
          ...(project.address || {}),
        },
        studentCount:
          project.center_type === "school"
            ? {
                boys: project.studentCount?.boys ?? defaultStudentCount.boys,
                girls: project.studentCount?.girls ?? defaultStudentCount.girls,
                total: project.studentCount?.total ?? defaultStudentCount.total,
              }
            : undefined,
        population:
          project.center_type === "village"
            ? {
                total: project.population?.total ?? defaultPopulation.total,
                male: project.population?.male ?? defaultPopulation.male,
                female: project.population?.female ?? defaultPopulation.female,
                children:
                  project.population?.children ?? defaultPopulation.children,
                adults: project.population?.adults ?? defaultPopulation.adults,
              }
            : undefined,
        waterQualityData: {
          ...ProjectFormValues.waterQualityData,
          ...(project.waterQualityData || {}),
        },
        curency_type: project?.curency_type || "INR",
        createdByUserId: project?.createdByUserId || user?._id || "",
        projectStartDate:
          project?.projectStartDate || ProjectFormValues.projectStartDate,
        projectEndDate: project?.projectEndDate || undefined,
        numberOfClasses:
          project.center_type === "school"
            ? project.numberOfClasses
            : undefined,
        schoolName:
          project.center_type === "school" ? project.schoolName : undefined,
        academicYear:
          project.center_type === "school" ? project.academicYear : undefined,
        udiseCode:
          project.center_type === "school" ? project.udiseCode : undefined,
      };

      setTimeout(() => {
        reset(filteredProject as ProjectSchema);
      }, 200);
    }
  }, [open, project, isEdited, reset, user?._id]);

  const getBannerImage = async (file: File) => {
    if (!file) return;
    try {
      if (bannerPreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(bannerPreviewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setBannerPreviewUrl(previewUrl);
      setSelectedBannerFile(file);
      setValue("bannerImageUrl", previewUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      console.error("Error processing banner image:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-auto max-h-[92vh] !gap-0 w-[96vw] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border/70 p-0">
        <DialogTitle>
          <div className="sticky top-0 z-20 flex w-full items-center justify-between border-b bg-background/95 px-5 py-4 backdrop-blur sm:px-7">
            <strong className="text-lg font-semibold leading-none">
              {isEdited ? "Update" : "Create"} Center
            </strong>
            <button
              disabled={isLoading}
              className="rounded-full p-2 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </DialogTitle>

        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          onSubmit={handleSubmit(handleSubmitForm, handleInvalidSubmit)}
        >
          {isLoading && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
              <Image
                src={require("@/assets/pyramid-19501_256.gif")}
                alt="Loading..."
                width={200}
                height={200}
                className="h-32 w-32"
                loading="eager"
              />
              <p className="text-sm font-medium text-foreground">
                {isEdited ? "Updating center..." : "Creating center..."}
              </p>
            </div>
          )}
          {loadImages && (
            <div
              onClick={() => setLoadImages(false)}
              className="absolute top-0 left-0 w-full h-full z-30 p-5 bg-black/25 backdrop-blur-sm "
            >
              <LoadImages
                onSelectImage={(imgString: string) => {
                  if (bannerPreviewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(bannerPreviewUrl);
                  }
                  setBannerPreviewUrl("");
                  setSelectedBannerFile(null);
                  setValue("bannerImageUrl", imgString, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setLoadImages(false);
                }}
              />
            </div>
          )}
          <div className="flex min-h-0 flex-1">
            <aside className="hidden w-72 flex-col border-r border-border/70 bg-[radial-gradient(circle_at_top,_rgba(34,112,119,0.22),_transparent_58%),radial-gradient(circle_at_bottom,_rgba(212,101,53,0.18),_transparent_48%)] p-5 md:flex">
              <div className="rounded-2xl border border-[#227077]/20 bg-background/90 p-4 shadow-sm backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#227077]">
                  Center Builder
                </p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  Create with confidence
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fill each step to publish a complete center profile.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Progress
                  </p>
                  <span className="text-xs font-semibold text-[#227077]">
                    {currentStepIndex + 1}/5
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-[#227077] transition-all"
                    style={{
                      width: `${((currentStepIndex + 1) / TAB_ORDER.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/90 p-3 shadow-sm backdrop-blur-sm">
                <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Steps
                </p>
                <ul className="mt-2 space-y-2">
                  {TAB_ORDER.map((stepKey, index) => {
                    const isActive = activeFormTab === stepKey;
                    return (
                      <li
                        key={stepKey}
                        className={`flex items-start gap-2 rounded-xl border px-2.5 py-2 text-xs transition-colors ${
                          isActive
                            ? "border-[#227077]/35 bg-[#227077]/15 text-foreground"
                            : "border-border/60 bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${isActive ? "bg-[#227077] text-white" : "bg-muted text-muted-foreground"}`}
                        >
                          {index + 1}
                        </span>
                        <span className="leading-5">
                          {STEP_LABELS[stepKey]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </aside>

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-4 pt-5 sm:px-7 [&_input]:h-10 [&_input]:rounded-xl [&_input]:border-border/80 [&_label]:text-xs [&_label]:font-semibold [&_textarea]:rounded-xl [&_textarea]:border-border/80 [&_textarea]:min-h-[120px] [&_[role=button]]:rounded-xl">
              <Tabs
                value={activeFormTab}
                onValueChange={(value) => {
                  if (!isLoading) setActiveFormTab(value);
                }}
                className="space-y-4"
              >
                <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-2">
                  <TabsTrigger
                    value="step1"
                    className="rounded-lg border border-transparent px-4 text-muted-foreground data-[state=active]:border-[#227077]/35 data-[state=active]:bg-[#227077] data-[state=active]:text-white"
                  >
                    1. Setup
                  </TabsTrigger>
                  <TabsTrigger
                    value="step2"
                    className="rounded-lg border border-transparent px-4 text-muted-foreground data-[state=active]:border-[#227077]/35 data-[state=active]:bg-[#227077] data-[state=active]:text-white"
                  >
                    2. Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="step3"
                    className="rounded-lg border border-transparent px-4 text-muted-foreground data-[state=active]:border-[#227077]/35 data-[state=active]:bg-[#227077] data-[state=active]:text-white"
                  >
                    3. Strength
                  </TabsTrigger>
                  <TabsTrigger
                    value="step4"
                    className="rounded-lg border border-transparent px-4 text-muted-foreground data-[state=active]:border-[#227077]/35 data-[state=active]:bg-[#227077] data-[state=active]:text-white"
                  >
                    4. Address
                  </TabsTrigger>
                  <TabsTrigger
                    value="step5"
                    className="rounded-lg border border-transparent px-4 text-muted-foreground data-[state=active]:border-[#227077]/35 data-[state=active]:bg-[#227077] data-[state=active]:text-white"
                  >
                    5. Water
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="step1" className="mt-0 space-y-4">
                  {/* Title */}
                  <div className="mb-7 flex flex-col gap-4 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                    <Controller
                      control={control}
                      name="bannerImageUrl"
                      render={({ field: { onChange, value } }) => (
                        <div className="mt-1">
                          <div className="border border-dashed rounded-lg p-4 text-center relative overflow-hidden ">
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            {/* <p className="text-sm font-medium">Upload Cover Image</p> */}
                            <p className="my-3 text-xs text-muted-foreground">
                              Upload Cover Image
                            </p>
                            {value && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {value || "No image selected"}
                              </p>
                            )}
                            {(!value ||
                              value?.length <= 3 ||
                              !value?.includes("http")) && (
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                className="relative mt-2 overflow-hidden rounded-full px-5"
                              >
                                Upload image
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="absolute top-0 left-0 !w-full !h-full opacity-0 z-10 "
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      onChange(file?.name); // Update the field value
                                      getBannerImage(file);
                                    }
                                  }}
                                />
                              </Button>
                            )}
                            {value?.length > 0 && (
                              <div className=" absolute top-0 left-0 !w-full !h-full flex flex-col ">
                                <Image
                                  src={bannerPreviewUrl || value}
                                  alt="img"
                                  className="w-full h-full object-cover "
                                  width={100}
                                  height={100}
                                  loading="eager"
                                />
                                <Button
                                  onClick={() => {
                                    if (bannerPreviewUrl.startsWith("blob:")) {
                                      URL.revokeObjectURL(bannerPreviewUrl);
                                    }
                                    setBannerPreviewUrl("");
                                    setSelectedBannerFile(null);
                                    setValue("bannerImageUrl", "", {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                  className="absolute top-2 w-8 h-8 right-2 rounded-full !bg-opacity-30 flex flex-col"
                                  type="button"
                                >
                                  <X size={30} />
                                </Button>
                              </div>
                            )}
                            {imageLoading && (
                              <div className="absolute top-0 left-0 !w-full !h-full flex flex-col items-center justify-center bg-black/25 backdrop-blur-sm">
                                <Image
                                  src={require("@/assets/pyramid-19501_256.gif")}
                                  alt="Loading..."
                                  width={200}
                                  height={200}
                                  className="w-40 h-40"
                                  loading="eager"
                                />
                              </div>
                            )}
                          </div>
                          {errors.bannerImageUrl &&
                            (!value || value?.length <= 3) && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.bannerImageUrl.message}
                              </span>
                            )}
                        </div>
                      )}
                    />
                    {/* <Button
                                    onClick={() => setLoadImages(!loadImages)}
                                    type="button" className='uppercase my-3 px-6 max-w-fit ' >
                                    Add image
                                </Button> */}

                    <strong className="mt-1 text-sm font-semibold">
                      Status
                    </strong>
                    <Controller
                      control={control}
                      name="projectStatus"
                      render={({ field: { onChange, value } }) => (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            className="flex h-10 capitalize w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <p>{value ? value : "Select Status"}</p>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {ProjectStatusArray &&
                              ProjectStatusArray.length > 0 &&
                              ProjectStatusArray.map((status) => (
                                <DropdownMenuItem
                                  className="capitalize cursor-pointer"
                                  key={status}
                                  onClick={() => onChange(status)}
                                >
                                  {status}
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    />

                    <strong className="mt-1 text-sm font-semibold">
                      Center Type
                    </strong>
                    <Controller
                      control={control}
                      name="center_type"
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              className="flex h-10 capitalize w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <p>{value ? value : "Select center type"}</p>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                className="capitalize cursor-pointer"
                                onClick={() => {
                                  onChange("school");
                                  setValue(
                                    "totalProjectCost",
                                    SCHOOL_PROJECT_COST,
                                    { shouldDirty: true, shouldValidate: true },
                                  );
                                }}
                              >
                                school
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="capitalize cursor-pointer"
                                onClick={() => {
                                  onChange("village");
                                  setValue(
                                    "totalProjectCost",
                                    VILLAGE_PROJECT_COST,
                                    { shouldDirty: true, shouldValidate: true },
                                  );
                                }}
                              >
                                village
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    />
                    {/* Story */}
                    <Controller
                      control={control}
                      name="description"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <div>
                          <label className="text-sm font-medium">
                            About the{" "}
                            {centerType === "village" ? "village" : "school"}*
                          </label>
                          <Textarea
                            minLength={20}
                            onChange={onChange}
                            value={value}
                            placeholder="Write a story"
                          />
                          <span className=" text-sm truncate">
                            {watch("description")?.length ?? 0}/20
                          </span>
                          <br />
                          {errors.description && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.description.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    {/* <Controller
                                        control={control}
                                        name="title"
                                        render={({ field: { onChange, value, onBlur } }) => (
                                            <div className='w-full pl-10' >
                                                <label className="text-sm">Title*</label>
                                                <Input onChange={onChange} value={value} placeholder="Enter project title" />
                                                {errors.title && <span className="text-red-500 text-sm truncate">{errors.title.message}</span>}
                                            </div>
                                        )}
                                    /> */}
                  </div>
                </TabsContent>

                <TabsContent value="step2" className="mt-0 space-y-4">
                  <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                    <strong className="text-sm font-semibold">
                      School or Village Details
                    </strong>

                    {centerType === "school" && (
                      <>
                        <Controller
                          control={control}
                          name="udiseCode"
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <label className="text-sm font-medium ">
                                UDISE Code*
                              </label>
                              <Input
                                onChange={onChange}
                                value={value}
                                placeholder="Enter UDISE Code"
                              />
                              {errors.udiseCode && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.udiseCode.message}
                                </span>
                              )}
                            </div>
                          )}
                        />

                        <Controller
                          control={control}
                          name="schoolName"
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <label className="text-sm font-medium">
                                Name of school*
                              </label>
                              <Input
                                onChange={onChange}
                                value={value}
                                placeholder="Enter Name of school"
                              />
                              {errors.schoolName && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.schoolName.message}
                                </span>
                              )}
                            </div>
                          )}
                        />

                        <Controller
                          control={control}
                          name="academicYear"
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <label className="text-sm font-medium">
                                School year starts in
                              </label>
                              <div className="relative">
                                <Button
                                  type="button"
                                  onClick={() =>
                                    setYearOnlypicker(!openYearOnly)
                                  }
                                  variant="outline"
                                  className={`w-full justify-start text-muted-foreground text-left font-normal
                                                                    ${value ? "text-foreground" : "text-muted-foreground"}
                                                                    ${errors.academicYear ? "border-red-500" : ""}
                                                                    `}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {value
                                    ? new Date(value)?.getFullYear()
                                    : "School year starts in"}
                                </Button>
                                {openYearOnly && (
                                  <div className="absolute top-[40px] w-full rounded-md max-w-[300px] bg-white shadow-lg h-80 left-0 overflow-y-auto py-1">
                                    <YearOnlyPicker
                                      fromYear={1600}
                                      onSelect={(year: number) => {
                                        const selectedDate = new Date(
                                          year,
                                          0,
                                          1,
                                        );
                                        onChange(selectedDate.toISOString());
                                        setYearOnlypicker(false);
                                      }}
                                      onClose={() => setYearOnlypicker(false)}
                                    />
                                  </div>
                                )}
                              </div>
                              {errors.academicYear && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.academicYear.message}
                                </span>
                              )}
                            </div>
                          )}
                        />

                        <Controller
                          control={control}
                          name="numberOfClasses"
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <label className="text-sm font-semibold ">
                                Number for classrooms
                              </label>
                              <Input
                                type="text"
                                value={value === 0 ? "" : value}
                                inputMode="numeric"
                                onChange={(e) => {
                                  const val = toDigitString(e.target.value, 3);
                                  onChange(toNumberValue(val));
                                }}
                                placeholder="Enter number of classes"
                              />
                              {errors.numberOfClasses && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.numberOfClasses.message}
                                </span>
                              )}
                            </div>
                          )}
                        />
                      </>
                    )}

                    {centerType === "village" && (
                      <>
                        <Controller
                          control={control}
                          name="title"
                          render={({ field: { onChange, value } }) => (
                            <div>
                              <label className="text-sm font-medium">
                                Village / Center title
                              </label>
                              <Input
                                onChange={onChange}
                                value={value || ""}
                                placeholder="Enter village or center title"
                              />
                              {errors.title && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.title.message as string}
                                </span>
                              )}
                            </div>
                          )}
                        />
                        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                          Add population in Step 3 and address in Step 4.
                        </p>
                      </>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="step3" className="mt-0 space-y-4">
                  {/* Student Strength */}
                  {centerType === "school" && (
                    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                      <strong className="text-sm font-semibold">
                        Student Strength
                      </strong>
                      <Controller
                        control={control}
                        name={`studentCount.girls`}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Girls{" "}
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updateStudentCount(
                                  "girls",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder={`Enter girls count`}
                            />
                            {errors.studentCount?.girls && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.studentCount.girls?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"studentCount.boys"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              boys
                            </label>
                            <Input
                              value={value === 0 ? "" : value} // show empty if value is 0
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updateStudentCount(
                                  "boys",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder={`Enter boys count`}
                            />
                            {errors.studentCount?.boys && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.studentCount?.boys?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"studentCount.total"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Total students *
                            </label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={value || ""}
                              onChange={(e) =>
                                updateTotalStudents(e.target.value, onChange)
                              }
                              placeholder="Enter total students count"
                            />

                            {errors.studentCount?.total && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.studentCount.total?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  )}
                  {centerType === "village" && (
                    <div className="mb-3 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                      <strong className="text-sm font-semibold">
                        Population Details
                      </strong>
                      <Controller
                        control={control}
                        name={"population.male"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Male
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updatePopulationCount(
                                  "male",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder="Enter male population"
                            />
                            {errors.population?.male && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.male?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"population.female"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Female
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updatePopulationCount(
                                  "female",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder="Enter female population"
                            />
                            {errors.population?.female && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.female?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"population.children"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Children
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updatePopulationCount(
                                  "children",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder="Enter children population"
                            />
                            {errors.population?.children && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.children?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"population.adults"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Adults
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updatePopulationCount(
                                  "adults",
                                  e.target.value,
                                  onChange,
                                )
                              }
                              placeholder="Enter adult population"
                            />
                            {errors.population?.adults && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.adults?.message}
                              </span>
                            )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={"population.total"}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="text-sm capitalize font-semibold">
                              Total population *
                            </label>
                            <Input
                              value={value === 0 ? "" : value}
                              type="text"
                              inputMode="numeric"
                              onChange={(e) =>
                                updatePopulationTotal(e.target.value, onChange)
                              }
                              placeholder="Enter total population"
                            />
                            {errors.population?.total && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.total?.message}
                              </span>
                            )}
                            {errors.population?.message && (
                              <span className="text-red-500 text-sm truncate">
                                {errors.population.message as string}
                              </span>
                            )}
                          </div>
                        )}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="step4" className="mt-0 space-y-4">
                  <div className="mt-1 flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
                    <strong className="text-sm font-semibold">Address</strong>
                    <Controller
                      control={control}
                      name={"address.villageName"}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            village*
                          </label>
                          <Input
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter village`}
                          />
                          {errors.address?.villageName && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address?.villageName?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`address.mandalName`}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            Mandal*
                          </label>
                          <Input
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter Mandal`}
                          />
                          {errors.address?.mandalName && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address.mandalName?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`address.districtName`}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            district*
                          </label>
                          <Input
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter district`}
                          />
                          {errors.address?.districtName && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address.districtName?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`address.stateName`}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            state*
                          </label>
                          <Input
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter state`}
                          />
                          {errors.address?.stateName && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address.stateName?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={control}
                      name={`address.countryName`}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            Country*
                          </label>
                          <Input
                            value={value}
                            onChange={onChange}
                            placeholder={`Enter Country`}
                          />
                          {errors.address?.countryName && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address.countryName?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />

                    <Controller
                      control={control}
                      name={`address.postalCode`}
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm capitalize font-semibold">
                            pincode
                          </label>
                          <Input
                            title="Postal code must be exactly 6 digits"
                            minLength={1}
                            value={value}
                            type="text"
                            inputMode="numeric"
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^\d{0,10}$/.test(val)) {
                                onChange(val);
                              }
                            }}
                            placeholder={`Enter pincode`}
                          />
                          {errors.address?.postalCode && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.address.postalCode?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div className="mb-7 flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                    <Controller
                      control={control}
                      name="locationUrl"
                      render={({ field: { onChange, value } }) => (
                        <div>
                          <label className="text-sm font-semibold">
                            Location URL*
                          </label>
                          <Input
                            type="url"
                            value={value}
                            onChange={onChange}
                            placeholder="Enter Google Maps link"
                          />
                          {errors.locationUrl && (
                            <span className="text-red-500 text-sm truncate">
                              {errors.locationUrl.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="step5" className="mt-0 space-y-4">
                  {/* Water Quality Data */}

                  <div className="mb-3 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                    <strong className="text-sm font-semibold">
                      Water Quality Data
                    </strong>
                    <div className="mt-3 flex flex-col items-center gap-3">
                      <Controller
                        control={control}
                        name={"waterQualityData.collectionDate"}
                        render={({ field: { onChange, value, onBlur } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              Date of Collection
                            </label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={`w-full justify-start text-muted-foreground text-left font-normal
                                                            ${value ? "text-foreground" : "text-muted-foreground"}
                                                            `}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {value && !isNaN(new Date(value).getTime())
                                    ? format(new Date(value), "PPP")
                                    : "Date of Collection"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                side="bottom"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={value ? new Date(value) : undefined}
                                  onSelect={(data: Date | undefined) => {
                                    if (data) {
                                      onChange(data.toISOString());
                                    } else {
                                      onChange(undefined);
                                    }
                                  }}
                                  // initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`waterQualityData.phLevel`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              pH &#40;6.6-8.5&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter pH`}
                            />
                            {errors.waterQualityData?.phLevel &&
                              errors.waterQualityData?.phLevel.message && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.waterQualityData.phLevel?.message}
                                </span>
                              )}
                          </div>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`waterQualityData.totalDissolvedSolids`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              TDS &#40;{"< "}500mg/l&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter TDS`}
                            />
                            {errors.waterQualityData?.totalDissolvedSolids &&
                              errors.waterQualityData?.totalDissolvedSolids
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.totalDissolvedSolids
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.turbidityLevel`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3 ">
                            <label className="text-sm capitalize font-semibold">
                              turbidity &#40;{"< "}1.0&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter turbidity`}
                            />
                            {errors.waterQualityData?.turbidityLevel &&
                              errors.waterQualityData?.turbidityLevel
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.turbidityLevel
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.totalHardness`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3">
                            <label className="text-sm capitalize font-semibold">
                              hardness &#40;{"< "}200&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter hardness`}
                            />
                            {errors.waterQualityData?.totalHardness &&
                              errors.waterQualityData?.totalHardness
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.totalHardness
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.calciumContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold ">
                              calcium &#40;{"< "}75&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter calcium`}
                            />
                            {errors.waterQualityData?.calciumContent &&
                              errors.waterQualityData?.calciumContent
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.calciumContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.magnesiumContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              magnesium &#40;{"< "}30&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter magnesium`}
                            />
                            {errors.waterQualityData?.magnesiumContent &&
                              errors.waterQualityData?.magnesiumContent
                                .message && (
                                <span className="text-red-500 text-sm truncate  ">
                                  {
                                    errors.waterQualityData.magnesiumContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.sodiumContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              sodium &#40;NS&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter sodium`}
                            />
                            {errors.waterQualityData?.sodiumContent &&
                              errors.waterQualityData?.sodiumContent
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.sodiumContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.potassiumContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3">
                            <label className="text-sm capitalize font-semibold">
                              potassium &#40;NS&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter potassium`}
                            />
                            {errors.waterQualityData?.potassiumContent &&
                              errors.waterQualityData?.potassiumContent
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.potassiumContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.chlorideLevel`}
                        rules={{ required: true }}
                        render={({ field: { value, onChange } }) => (
                          <div className="w-full mb-3 ">
                            <label className="text-sm capitalize font-semibold">
                              chloride &#40;{"< "}250&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter chloride`}
                            />
                            {errors.waterQualityData?.chlorideLevel &&
                              errors.waterQualityData?.chlorideLevel
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.chlorideLevel
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.fluorideLevel`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              fluoride &#40;{"< "}1mg/l&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter fluoride`}
                            />
                            {errors.waterQualityData?.fluorideLevel &&
                              errors.waterQualityData?.fluorideLevel
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.fluorideLevel
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.ironContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              iron &#40;{"< "}0.3 mg/l&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter Iron`}
                            />
                            {errors.waterQualityData?.ironContent &&
                              errors.waterQualityData?.ironContent.message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData?.ironContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.arsenicLevel`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3">
                            <label className="text-sm capitalize font-semibold">
                              arsenic &#40;{"< "}0.0mg/l&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter arsenic`}
                            />
                            {errors.waterQualityData?.arsenicLevel &&
                              errors.waterQualityData?.arsenicLevel.message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.arsenicLevel
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.zincContent`}
                        rules={{ required: true }}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full ">
                            <label className="text-sm capitalize font-semibold">
                              zinc &#40;Max 05&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter zinc`}
                            />
                            {errors.waterQualityData?.zincContent &&
                              errors.waterQualityData?.zincContent.message && (
                                <span className="text-red-500 text-sm truncate">
                                  {errors.waterQualityData.zincContent?.message}
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        rules={{ required: true }}
                        name={`waterQualityData.manganeseContent`}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3 ">
                            <label className="text-sm capitalize font-semibold">
                              manganese &#40;Max 0.1&#41;*
                            </label>
                            <Input
                              type="text"
                              pattern="[-+]?[0-9]*\\.?[0-9]+"
                              title="Must include a number (e.g., 1, -0.5, .75)"
                              value={value ? value : ""}
                              onChange={(dataValue) => {
                                onChange(dataValue.target.value || "");
                              }}
                              placeholder={`Enter manganese`}
                            />
                            {errors.waterQualityData?.manganeseContent &&
                              errors.waterQualityData?.manganeseContent
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData.manganeseContent
                                      ?.message
                                  }
                                </span>
                              )}
                          </div>
                        )}
                      />
                      <Controller
                        control={control}
                        name={`waterQualityData.totalColiformBacteria`}
                        render={({ field: { onChange, value } }) => (
                          <div className="w-full mb-3">
                            <label className="text-sm capitalize font-semibold">
                              Coliform Bacteria*
                            </label>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <p>
                                  {value ? value : "Enter Coliform Bacteria"}
                                </p>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onClick={() => onChange("Present")}
                                >
                                  Present
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onChange("Absent")}
                                >
                                  Absent
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {errors.waterQualityData?.totalColiformBacteria &&
                              errors.waterQualityData?.totalColiformBacteria
                                .message && (
                                <span className="text-red-500 text-sm truncate">
                                  {
                                    errors.waterQualityData
                                      .totalColiformBacteria?.message
                                  }
                                </span>
                              )}
                          </div>
                          // <div className='w-full mb-3' >
                          //     <label className="text-sm capitalize font-semibold">totalColiformBacteria &#40;values: Present or Absent&#41;</label>
                          //     <Input required type="text" value={value ? value : "Absent"} onChange={(dataValue) => {
                          //         onChange(dataValue.target.value);
                          //     }} placeholder={`Enter totalColiformBacteria`} />
                          // {(errors.waterQualityData?.totalColiformBacteria && errors.waterQualityData?.totalColiformBacteria.message) && (
                          //     <span className="text-red-500 text-sm truncate">{errors.waterQualityData.totalColiformBacteria?.message}</span>
                          // )}
                          // </div>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="step1" className="mt-0 space-y-4">
                  {/* Project Cost */}
                  <Controller
                    control={control}
                    name="totalProjectCost"
                    render={({ field: { onChange, value } }) => (
                      <div className="relative mb-8 rounded-xl border border-border/70 bg-card p-4 sm:p-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <label className="text-sm font-semibold ">
                            Project Cost*
                          </label>
                          <Controller
                            control={control}
                            name="curency_type"
                            render={({
                              field: {
                                onChange: onCurrencyChange,
                                value: currencyValue,
                              },
                            }) => (
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="flex h-9 min-w-[100px] items-center justify-center rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                  <p>{currencyValue || "Currency"}</p>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {CURRENCY_OPTIONS.map((currency) => (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      key={currency}
                                      onClick={() => {
                                        onCurrencyChange(currency);
                                        if (!isEdited) {
                                          const amount =
                                            ProjectDefaultGoalAmounts[
                                              currency
                                            ] || 600000;
                                          setValue("totalProjectCost", amount, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          });
                                        }
                                      }}
                                    >
                                      {currency}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          />
                        </div>
                        <Input
                          // disabled={isEdited ? false : true}
                          type="text"
                          value={value ? value.toLocaleString("en-IN") : ""}
                          placeholder="Enter project cost"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateProjectCost(e.target.value, onChange)
                          }
                          className="pl-6"
                        />
                        <span className="absolute left-7 top-[86px] -translate-y-1/2 text-sm text-foreground sm:left-8">
                          {coverFormatedCurrency(10, displayCurrency)?.[0]}
                        </span>
                        {errors.totalProjectCost && (
                          <span className="text-red-500 text-sm truncate">
                            {errors.totalProjectCost.message}
                          </span>
                        )}
                        {errors.curency_type && (
                          <span className="text-red-500 text-sm truncate">
                            {errors.curency_type.message as string}
                          </span>
                        )}
                      </div>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Submit Button */}
            </div>
          </div>
          <div className="border-t bg-background px-5 py-4 sm:px-7">
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="min-w-[120px] rounded-full"
                disabled={isLoading || activeFormTab === "step1"}
                onClick={goToPreviousTab}
              >
                Back
              </Button>
              {activeFormTab !== "step5" && (
                <Button
                  type="button"
                  variant="outline"
                  className="min-w-[120px] rounded-full"
                  disabled={isLoading}
                  onClick={goToNextTab}
                >
                  Next
                </Button>
              )}
              {activeFormTab === "step5" && (
                <Button
                  className="min-w-[140px] rounded-full"
                  type="submit"
                  disabled={isLoading}
                >
                  {isEdited ? "Update" : "Create"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectModal;

interface LoadImageProps {
  onSelectImage: (file: string) => void;
}
const LoadImages: React.FC<LoadImageProps> = ({ onSelectImage }) => {
  return (
    <div
      onClick={(e) => {
        e?.preventDefault();
        e?.stopPropagation();
      }}
      className="max-w[300px] w-full min-h-[200px] max-h-[400px] shadow-md  bg-white rounded-lg overflow-x-hidden overflow-y-auto relative"
    >
      <div className="w-full h-full flex flex-row flex-wrap  gap-4 justify-center ">
        {Object.entries(IMAGE_LINKS) &&
          Object.entries(IMAGE_LINKS).map(([key, value]) => {
            return (
              <div
                key={key}
                onClick={() => onSelectImage(value as string)}
                className="w-[90px] h-[90px] overflow-hidden rounded-sm bg-gray-200 
                                border border-transparent hover:border-teal-500 cursor-pointer
                                "
              >
                <Image
                  key={key}
                  src={
                    (value as string) ||
                    "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6277_11zon_1749618412588-1756100054855.jpg"
                  }
                  alt={key}
                  width={90}
                  height={90}
                  loading="eager"
                  className="w-full h-full object-cover rounded-sm"
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
