"use client";
import { use, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Upload, ChevronsUpDown, CalendarIcon, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format } from "date-fns";
import { Calendar } from "../ui/calendar";
import { fileService } from "@/app/utils/fileSevice";
import Image from "next/image";
import { useAppSelector } from "@/app/lib/redox/hooks";
import {
  FundraiserReasonEnum,
  FundraiserSchema,
  FundraiserStatusEnum,
} from "@/app/_types/fundraiser.types";
import { useProjectsHook } from "@/app/lib/storeHooks/useProjects";
import { ProjectModal } from "@/app/_types/project.types";
import {
  createFundraiser,
  updateFundraiser,
} from "@/app/_services/fundraiser.service";
import { useAuthStore } from "@/app/stores/authStore";
import config from "@/app/config/config";
const fundraiserFormSchema = z.object({
  title: z.string().min(3),
  startDate: z.string().min(2),
  endDate: z.string().min(2),
  goal: z.number().min(1),
  raised: z.number().default(0),

  reason: z.string().min(1),
  customReason: z.string().optional(),

  story: z.string().min(10),
  projectId: z.string(),

  donorUpdatesVisible: z.boolean().default(true),
  bannerImage: z.string().url().optional(),

  createdBy: z.string(),
  status: FundraiserStatusEnum.default("active"),

  currency_type: z.string().default("INR").optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FundraiserFormValues = z.infer<typeof fundraiserFormSchema>;

export function FundraiserDialog({
  children,
  onSuccess,
  project_id,
  isEdited = false,
  editeFundraiser,
}: {
  children: React.ReactNode;
  onSuccess: (data?: any) => void;
  project_id?: string;
  isEdited?: boolean;
  editeFundraiser?: FundraiserSchema;
}) {
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectModal>(
    {} as ProjectModal,
  );
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {
    projects,
    loading,
    fetchProjects,
    totalPages,
    currentPage,
    totalCount,
    error,
  } = useProjectsHook();
  const { user: DBUser, isLoading: UserLoaing } = useAuthStore();

  const anchoreRef = useRef<HTMLAnchorElement>(null);
  const form = useForm<FundraiserFormValues>({
    resolver: zodResolver(fundraiserFormSchema),
    defaultValues: {
      title: "",
      startDate: "",
      endDate: "",
      goal: 0,
      raised: 0,
      reason: "",
      customReason: "",
      story: "",
      projectId: project_id || "",
      donorUpdatesVisible: true,
      bannerImage: "",
      createdBy: DBUser?._id,
      status: "active",
    },
  });

  useEffect(() => {
    if (open) {
      const loadProject = async () => {
        await fetchProjects(1, 40);
      };

      if (projects.length <= 0) {
        loadProject();
      }
    }
  }, [open]);

  useEffect(() => {
    if (DBUser) {
      form.setValue("createdBy", DBUser?._id || "");
    }
  }, [DBUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async () => {
    let data: FundraiserFormValues = form.getValues();

    if (isEdited) {
      data.createdAt = editeFundraiser?.createdAt || "";
      data.updatedAt = new Date().toISOString();
    }

    if (!data.projectId) {
      alert(" please select project ");
      return null;
    }
    const isValid = fundraiserFormSchema.safeParse(data);
    if (!isValid.success) {
      let fields: string[] = [];
      isValid.error.issues?.forEach((item: any) => {
        fields.push(item.path[0]);
      });
      alert("misssing fields =>  " + fields?.join(","));
      return null;
    }
    if (!termsAccepted) {
      toast({
        title: "Please accept the terms and conditions",
      });

      alert("Please accept the terms and conditions");
      setTermsAccepted(false);
    } else {
      if (isValid.success) {
        if (!isEdited) {
          setIsLoading(true);
          const response = await createFundraiser(data);
          setIsLoading(false);
          if (response && response !== null) {
            onSuccess(response);
            toast({
              title: "Fundraiser created successfully!",
              description:
                "Your fundraiser has been set up and is ready to share.",
            });
          } else {
            toast({
              title: "Fundraiser creation failed",
            });
          }
        }
        if (isEdited) {
          setIsLoading(true);
          const response: any = await updateFundraiser(
            data,
            editeFundraiser?._id || "",
          );
          setIsLoading(false);
          setOpen(false);
          if (response?.data?.data) {
            if (response?.data?.data) {
              onSuccess && onSuccess(response?.data?.data);
              toast({
                variant: "default",
                title: "campaign updated successfully",
              });
            }
          } else {
            toast({
              variant: "destructive",
              title: "failed to create campaign",
            });
          }
        }
        setOpen(false);
        setTermsAccepted(false);
        form.reset();
        // to move campagin details page
        // if (anchoreRef.current) {
        //     anchoreRef.current.click();
        // }
      } else {
        setOpen(false);
        setTermsAccepted(false);
        setTermsAccepted(false);
        form.reset();
        toast({
          title: "Form is not valid",
        });
      }
    }
  };

  useEffect(() => {
    if (open) {
      if (isEdited) {
        form.setValue("updatedAt", new Date().toISOString());
        form.setValue("goal", editeFundraiser?.goal || 0);
      } else {
        form.setValue(
          "bannerImage",
          "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6130_11zon_1749618147883-1756099512582.jpg",
        );
        form.setValue("createdAt", new Date().toISOString());
        form.setValue("updatedAt", new Date().toISOString());
      }
    }
  }, [open]);

  useEffect(() => {
    selectedProject && selectedProject._id
      ? form.setValue("projectId", selectedProject._id)
      : form.setValue("projectId", "");
    form.setValue("startDate", new Date().toDateString());
    const formFields = form.getValues();
    if (editeFundraiser) {
      const filteredFundraiser = Object.keys(formFields).reduce(
        (acc: any, key) => {
          if (key in editeFundraiser) {
            acc[key as keyof typeof editeFundraiser] =
              editeFundraiser[key as keyof typeof editeFundraiser]; // Properly index
          }
          return acc;
        },
        {} as Partial<typeof editeFundraiser>,
      );
    }
  }, [selectedProject, editeFundraiser]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isEdited) {
      if (projects && project_id) {
        setSelectedProject(
          projects?.find((p: ProjectModal) => p._id === project_id) ||
            ({} as ProjectModal),
        );
        form.reset(editeFundraiser); // Reset form with only valid fields
      }
    }
    if (isEdited && editeFundraiser) {
      const formFields = form.getValues(); // Get current form fields
      // Ensure project is properly typed
      const filteredFundraiser = Object.keys(formFields).reduce(
        (acc: any, key) => {
          if (key in editeFundraiser) {
            acc[key as keyof typeof editeFundraiser] =
              editeFundraiser[key as keyof typeof editeFundraiser]; // Properly index
          }
          return acc;
        },
        {} as Partial<typeof editeFundraiser>,
      );
      form.reset(filteredFundraiser); // Reset form with only valid fields
      form.setValue("updatedAt", new Date().toISOString());
      form.setValue("goal", editeFundraiser?.goal);
    }
    if (open) {
      setTermsAccepted(false);
    }
  }, [open, projects]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (project_id && projects) {
      setSelectedProject(
        projects?.find((p: ProjectModal) => p._id === project_id) ||
          ({} as ProjectModal),
      );
    }
  }, [project_id, projects]);

  const getBannerImage = async (file: File) => {
    if (!isEdited) {
      if (!file) return;

      try {
        const response = await fileService.uploadImage(
          file,
          "campaign",
          "campaign-banner",
        );
        if (response?.file_key) {
          const signedUrl = await fileService.getPreviewSignedUrl(
            response.file_key,
          );
          if (signedUrl) {
            form?.setValue("bannerImage", signedUrl);
          }
        }
      } catch (error) {
        console.error("Error processing banner image:", error);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] min-h-[50vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-blue-500" />
            {isEdited ? "Update" : "Create"} Fundraiser
          </DialogTitle>
          <DialogDescription>
            Create your own fundraiser to help provide clean water to schools
            and villages.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className=" w-full h-full justify-center items-center flex flex-col ">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
              {/* Spinning Loader */}
              <Image
                src={require("@/assets/pyramid-19501_256.gif")}
                alt="Loading..."
                width={200}
                height={200}
                className="w-40 h-40"
                loading="eager"
              />
            </div>
          </div>
        )}
        {!isLoading && (
          <Form {...form}>
            <form
              onSubmit={(e: any) => {
                e?.preventDefault();
                e?.stopPropagation();
                onSubmit();
              }}
              className="space-y-6"
            >
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name of Fundraiser*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Clean Water for Village School"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a clear title that explains your fundraising
                        purpose
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field: { onChange, value } }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <p className="text-sm font-medium">From*</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value
                                  ? format(new Date(value), "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={value ? new Date(value) : undefined}
                                onSelect={(date) => {
                                  onChange(date ? date.toISOString() : "");
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field: { onChange, value } }) => (
                    <FormItem>
                      <FormControl>
                        <div>
                          <p className="text-sm font-medium">To*</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {value
                                  ? format(new Date(value), "PPP")
                                  : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={value ? new Date(value) : undefined}
                                onSelect={(date) => {
                                  onChange(date ? date.toISOString() : "");
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goal"
                  render={({ field: { onChange } }) => (
                    <FormItem>
                      <FormLabel>Fundraising Goal (₹)*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 50000"
                          min={1000}
                          type="text"
                          inputMode="numeric"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\d{0,100}$/.test(val)) {
                              onChange(Number(val));
                              form?.setValue("goal", Number(val));
                            }
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Set a realistic goal for your fundraiser (minimum
                        ₹1,000)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-col">
                  <p className="text-sm font-medium">Story:</p>
                  <div className="pl-8 pt-4">
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormControl>
                            <div className="flex flex-col  justify-between ">
                              <p className="text-sm font-medium">
                                Choose a Reason*
                              </p>
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  asChild
                                  className="border w-full border-gray-200 rounded-md p-2 cursor-pointer mt-[10px] "
                                >
                                  <div className="flex flex-row gap-2 items-center ">
                                    <p className=" text-sm text-muted-foreground truncate flex-1 ">
                                      {value ? value : "Select a reason"}
                                    </p>
                                    <ChevronsUpDown size={15} />
                                  </div>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                  align={"start"}
                                  className="!max-h-[300px] w-full !overflow-hidden flex flex-col "
                                >
                                  <div className="h-full overflow-y-auto flex-1 w-full ">
                                    {[
                                      "Honoring a loved one",
                                      "Celebrating a special occasion",
                                      "Celebrating a festival",
                                      "Marking a special day of commemoration",
                                    ].map((reason: any, index: number) => (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          form.setValue("reason", reason);
                                        }}
                                        className="cursor-pointer"
                                        key={index}
                                      >
                                        <p>{reason}</p>
                                      </DropdownMenuItem>
                                    ))}
                                    <p></p>
                                  </div>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="story"
                      render={({ field }) => (
                        <FormItem className="mt-4">
                          <FormLabel className="mt-3">
                            Fundraiser Story*
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell people why you're raising funds and how the money will be used..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Explain your story and why this cause matters to you
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bannerImage"
                      render={({ field: { onChange, value } }) => (
                        <FormItem className="mt-8">
                          <FormControl>
                            <div className="border border-dashed rounded-lg p-4 text-center overflow-hidden relative ">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm font-medium">
                                Upload Cover Image
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Drag and drop or click to upload (optional)
                              </p>
                              {value && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {value || "No image selected"}
                                </p>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 relative overflow-hidden "
                              >
                                Select Image
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

                              {value?.length && (
                                <div className=" absolute top-0 left-0 !w-full !h-full flex flex-col ">
                                  <Image
                                    src={value}
                                    alt="img"
                                    className="w-full h-full object-cover "
                                    width={100}
                                    height={100}
                                    loading="eager"
                                  />
                                  <Button
                                    onClick={() =>
                                      form?.setValue("bannerImage", "")
                                    }
                                    className="absolute top-2 w-8 h-8 right-2 rounded-full !bg-opacity-30 flex flex-col"
                                    type="button"
                                  >
                                    <X size={30} />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              <FormField
                control={form.control}
                name="donorUpdatesVisible"
                render={({ field: { onChange, value } }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex flex-row items-center justify-between ">
                        <div className="space-y-0.5">
                          <Label htmlFor="new-donation">
                            Show Donor Updates
                          </Label>
                        </div>
                        <Switch
                          id="new-donation"
                          onChange={(values) => onChange(!value)}
                          defaultChecked
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              {!isEdited && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Project*</p>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      className="border border-gray-200 rounded-md p-2 cursor-pointer  "
                    >
                      <div className="flex flex-row gap-2 items-center w-full overflow-hidden ">
                        <p className=" text-sm text-muted-foreground truncate w-[50px] flex-1 ">
                          {selectedProject && selectedProject?.schoolName
                            ? selectedProject.schoolName
                            : "Select a project"}
                        </p>
                        <ChevronsUpDown size={15} />
                      </div>
                    </DropdownMenuTrigger>
                    {true && (
                      <DropdownMenuContent
                        align={"start"}
                        className="!max-h-[300px] !max-w-[300px] !overflow-hidden flex flex-col "
                      >
                        <DropdownMenuLabel>Projects</DropdownMenuLabel>

                        <div className="h-full overflow-y-auto flex-1 w-full">
                          {projects &&
                            projects.length > 0 &&
                            projects.map(
                              (project: ProjectModal, index: number) => (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProject(project);
                                  }}
                                  className="cursor-pointer truncate w-full overflow-hidden"
                                  key={index}
                                >
                                  <p className="truncate">
                                    {project?.schoolName}
                                  </p>
                                </DropdownMenuItem>
                              ),
                            )}
                          <p></p>
                        </div>
                      </DropdownMenuContent>
                    )}
                  </DropdownMenu>
                </div>
              )}

              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={termsAccepted}
                    onCheckedChange={(value) =>
                      setTermsAccepted(!termsAccepted)
                    }
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I agree to the{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      terms and conditions
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-blue-600 hover:underline">
                      privacy policy
                    </a>
                  </FormLabel>
                </div>
              </FormItem>

              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  {isLoading
                    ? "Loading..."
                    : isEdited
                      ? "Update Fundraiser"
                      : "Create Fundraiser"}
                </Button>
              </DialogFooter>
            </form>
            <a
              ref={anchoreRef}
              href={`${config.WEBSITE_URL}/campaign?campaignId=2`}
              target="_blank"
              className="absolute top-0 left-0 w-0 h-0 p-0 m-0 "
            ></a>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
