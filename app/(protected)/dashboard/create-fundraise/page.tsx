"use client";
import {
  createFundraiser,
  updateFundraiser,
} from "@/app/_services/fundraiser.service";
import {
  fundraiserFormSchema,
  FundraiserSchema,
} from "@/app/_types/fundraiser.types";
import { useFundraisers } from "@/app/lib/storeHooks/useFundraisers";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Image from "next/image";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import {
  CalendarIcon,
  Check,
  ChevronDown,
  Heart,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Calendar } from "@/app/components/ui/calendar";
import { getTimelineInfo } from "@/app/utils/timelines";
import {
  CURRENCY_VALID,
  geolocationActions,
  getCurrencySymbol,
} from "@/app/lib/redox/slices/geolocationSlice";
import {
  coverFormatedCurrency,
  currencyTabs,
} from "@/app/utils/currency_coverter";
import { useAppDispatch, useAppSelector } from "@/app/lib/redox/hooks";
import { useProjectsHook } from "@/app/lib/storeHooks/useProjects";
import { ProjectModal } from "@/app/_types/project.types";
import Link from "next/link";
import { fileService } from "@/app/utils/fileSevice";
import ImageGallery from "@/app/components/gallery";
import { useRouter, useSearchParams } from "next/navigation";
import { addFundraiserToUpdate } from "@/app/lib/redox/slices/fundraiser.slice";
import { useAuthStore } from "@/app/stores/authStore";
import {
  checkProjectAmountToCreateFundraiser,
  useProjectsStore,
} from "@/app/stores/projects.store";
import { useSnackbar } from "@/app/components/SnackbarContext";
import { useToast } from "@/hooks/use-toast";
import config from "@/app/config/config";

const ReasonsList = [
  "Honoring a loved one",
  "Celebrating a special occasion",
  "Celebrating a festival",
  "Marking a special day of commemoration",
  "Other",
];

const MAX_CHARCTERS: number = 350;
const MAX_STUDENT_BIO_CHARCTERS: number = 500;
const MAX_STUDENT_NAME_CHARCTERS: number = 140;

const TABS = ["Info", "About", "Story", "Share"];
type TabTypes = (typeof TABS)[number];

const GallerIMages: string[] = [
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_5971_11zon_1749484492489-1756100804671.jpg",
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6183_11zon_1749484911500-1756100837337.jpg",
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6022_11zon_1749485058476-1756100867504.jpg",
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6165_11zon_11zon_1749485241870-1756100900372.jpg",
  "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6083_1749491357596-1756100943505.jpg",
];

const CreateFundraise = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [type, setType] = useState<string>(searchParams.get("type") || "");
  const [fundraiser_id, setFundraiserId] = useState<string>(
    searchParams.get("id") || "",
  );
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<TabTypes>(TABS[0]);
  const [isImageLoading, setIsImageLoading] = useState<boolean>(false);
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [fundraierToUpdate, setFundraierToUpdate] = useState<
    FundraiserSchema | any
  >({});
  const [isFectchingFundraiser, setIsFetchingFundraiser] =
    useState<boolean>(false);
  const [isFectchingProjects, setIsFetchingProjects] = useState<boolean>(false);
  const [shareLink, setShareLink] = useState<string>("https");
  const [toggleCurrency, setToggleCurrency] = React.useState<boolean>(false);
  const [activeCurrency, setActiveCurrency] = React.useState<
    CURRENCY_VALID | string
  >("INR");
  const [isCreating, setIsCreating] = React.useState<boolean>(false);
  const [selectedProject, setSelectedProject] = React.useState<
    Partial<ProjectModal>
  >({});
  const [viewAllImages, setViewAllImages] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const { publicProjects, fetchPublicProjects, getProjectById } =
    useProjectsStore();
  const { getFundraiser } = useFundraisers();
  const { addFundraiser } = useFundraisers();
  const [defaultImages, setDefaultImages] = useState<string[]>([]);
  const [gotoShare, setGotoShare] = useState<boolean>(false);
  // const [amountsToCheck, setAmountsToCheck] = useState<any>({ allowed: true } as any);
  const [isCheckingAmoun, setisCheckingAmount] = useState<boolean>(false);
  const [otherReasonText, setOtherReasonText] = useState<string>("");

  const snackbar = useSnackbar();
  const toster = useToast();

  const today = new Date();
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(today.getMonth() + 3);
  const oneYearLater = new Date();
  oneYearLater.setMonth(today.getMonth() + 12);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
    getValues,
    watch,
    trigger,
  } = useForm({
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
      projectId: "",
      donorUpdatesVisible: true,
      bannerImage: "",
      createdBy: "",
      status: "active",
      currency_type: "INR",
      studentName: "",
      institution: "",
      studentProfile: "",
      studentBio: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const reasonValue = watch("reason")?.trim();
  const reasonValueInTextarea = otherReasonText.trim() || "";

  const isValidReason =
    reasonValue === "Other"
      ? Boolean(reasonValueInTextarea)
      : Boolean(reasonValue);

  useEffect(() => {
    setValue("createdBy", user?._id || "");
  }, [user]);

  const loadProject = async () => {
    setIsFetchingProjects(true);
    await useProjectsStore.getState().fetchPublicProjects("active"); // ✅ await store fetch
    setIsFetchingProjects(false);
  };

  useEffect(() => {
    loadProject();
    if (fundraiser_id && fundraiser_id?.trim()?.length > 0) {
      const getFundraiserData = async () => {
        setIsFetchingFundraiser(true);
        const res = await getFundraiser(fundraiser_id);
        setIsFetchingFundraiser(false);
        if (res && res !== null) {
          setFundraierToUpdate(res);
          reset(res);
        } else {
          setFundraierToUpdate(null);
        }
      };
      getFundraiserData();
    }
  }, []);
  const onSubmit = async (e: any) => {
    let data = getValues();

    data.reason =
      data.reason === "Other" ? otherReasonText.trim() || "Other" : data.reason;

    const safeParse = fundraiserFormSchema.safeParse(data);
    if (!safeParse.success) {
      alert(safeParse.error.flatten().fieldErrors);
      setActiveTab(TABS[0]);
      return null;
    }
    let response = null;
    if (fundraiser_id && fundraiser_id?.trim()?.length > 0) {
      setIsCreating(true);
      response = await updateFundraiser(
        safeParse?.data,
        fundraierToUpdate?._id || "",
      );
      setIsCreating(false);
      if (response) {
        setIsCreating(false);
        toster.toast({
          variant: "default",
          title: "success",
          description: "Fundraiser updated successfully",
        });
      } else {
        setIsCreating(false);
        toster.toast({
          variant: "destructive",
          title: "Failed",
          description: "Failed to update fundraiser",
        });
      }
    } else {
      setIsCreating(true);
      response = await createFundraiser(safeParse?.data);
      if (response) {
        setIsCreating(false);
        toster.toast({
          variant: "default",
          title: "success",
          description: "Fundraiser created successfully",
        });
      } else {
        setIsCreating(false);
        toster.toast({
          variant: "destructive",
          title: "Failed",
          description: "Failed to create fundraiser",
        });
      }
    }
    if (response) {
      reset({
        title: "",
        startDate: "",
        endDate: "",
        goal: 0,
        raised: 0,
        reason: "",
        customReason: "",
        story: "",
        projectId: "",
        donorUpdatesVisible: true,
        bannerImage: "",
        createdBy: user?._id || "",
        status: "active",
        currency_type: "INR",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setType("");
      dispatch(addFundraiserToUpdate(null));
      setShareLink(`${config.WEBSITE_URL}/fundraisers/${response._id}`);
      setGotoShare(true);
      setActiveTab(TABS[3]);
      addFundraiser(response);
      router?.replace("/dashboard/create-fundraise");
      // window.open(`${config.WEBSITE_URL}/fundraisers/${response._id}`);
    }
    reset();
  };

  const onError = (errors: any) => {
    snackbar.show("Please check all the fields before submitting.", {
      type: "danger",
      position: "center",
      duration: 4000,
    });
    setActiveTab(TABS[0]);
  };

  useEffect(() => {
    setActiveCurrency(selectedCurrency);
  }, []);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    if (copied) {
      setTimeout(() => {
        setCopied(false);
      }, 1500);
    }
  }, [copied]);

  useEffect(() => {
    setDefaultImages(GallerIMages);
  }, []);

  const getBannerImage = async (file: File) => {
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
          setValue("bannerImage", signedUrl, { shouldValidate: true });
        }
      }
    } catch (error) {
      console.error("Error processing banner image:", error);
    }
  };

  useEffect(() => {
    if (
      fundraiser_id &&
      fundraiser_id?.trim()?.length > 0 &&
      fundraierToUpdate
    ) {
      reset(fundraierToUpdate);
    }
    const fetchProject = async () => {
      const response = await getProjectById(fundraierToUpdate?.projectId || "");
      if (response) {
        setSelectedProject(response);
      }
    };
    fetchProject();
  }, []);

  const handleTabClick = (tab: string) => {
    if (tab === TABS[3]) {
      if (gotoShare) {
        setActiveTab(tab);
        setIsImageLoading(true);
      }
    } else {
      setActiveTab(tab);
      setIsImageLoading(true);
    }

    if (tab === TABS[3]) {
      setShareLink("");
    }
    setShareLink("");
    setGotoShare(false);
  };

  const handleShareButton = () => {
    try {
      if (navigator.share) {
        navigator
          .share({
            text: `Hey! I’ve joined hands with Community for Water to bring clean water to school children in rural India. I’d love your support for my fundraiser, every drop counts. Donate now. Thank you!\n\n${shareLink}`,
          })
          .then(() => console.log("Share successful"))
          .catch((error) => console.log("Share failed:", error));
      } else {
        alert("Sharing not supported on this device/browser.");
      }
    } catch (error) {
      alert("Sharing not supported on this device/browser.");
    }
  };

  const disableButton = () => {
    if (activeTab === TABS[0]) {
      return !watch("studentName");
    } else if (activeTab === TABS[1]) {
      return !(
        watch("projectId") &&
        watch("startDate") &&
        watch("endDate") &&
        watch("goal")
      );
    } else if (activeTab === TABS[2]) {
      return !(
        watch("reason") &&
        watch("story") &&
        watch("story")?.trim() &&
        watch("story")?.trim()?.length >= 1 &&
        watch("title")
      );
    } else {
      return;
    }
  };

  useEffect(() => {
    if (
      selectedProject &&
      fundraierToUpdate &&
      publicProjects &&
      publicProjects?.length > 0
    ) {
      const project = publicProjects.find(
        (p) => p._id === fundraierToUpdate?.projectId,
      );
      if (project) {
        setSelectedProject(project);
        setValue("projectId", fundraierToUpdate?.projectId || "");
      }
    }
  }, [selectedProject, fundraierToUpdate, fundraiser_id, publicProjects]);

  const handleClick = async () => {
    if (activeTab === "About") {
      const minimumCheckAmount = 100;
      if (watch("goal") < minimumCheckAmount) {
        snackbar.show(
          `Minimum goal amount should be greater than or equal to ${coverFormatedCurrency(minimumCheckAmount, activeCurrency || "INR")}.`,
          {
            duration: 2000,
            position: "center",
            type: "warning",
          },
        );
        return;
      }
      setActiveTab(TABS[2]);
    } else if (activeTab === "Story") {
      setActiveTab(TABS[3]);
    } else if (activeTab === "Info") {
      setActiveTab(TABS[1]);
    }
  };

  if (
    fundraiser_id &&
    fundraiser_id?.trim()?.length > 0 &&
    (!fundraierToUpdate || !fundraierToUpdate._id) &&
    !isFectchingFundraiser
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p>Fundraiser not found to update </p>
      </div>
    );
  }

  if ((fundraiser_id && isFectchingFundraiser) || isFectchingProjects) {
    return (
      <div className="relative w-full h-full">
        {/* Loader */}
        <div className="absolute top-0 left-0 w-full h-full bg-[#E7F8F8] z-[1000] flex items-center justify-center flex-col gap-3">
          <div className="w-6 h-6 border-4 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[14px] text-primary-black font-signika">
            Wait a moment
          </span>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className=" w-full h-screen  grid screen1330:grid-cols-2 grid-cols-1 gap-5 overflow-y-auto">
        <div className="bg-[#E7F8F8] flex-1 w-full h-full flex flex-col rounded-xl screen1330:py-0 py-8 screen1330:px-5 px-10 overflow-y-auto">
          <h2 className="text-[#3B3B3B] font-semibold text-[36px] font-signika ">
            {fundraiser_id && fundraiser_id?.trim()?.length > 0
              ? "Update"
              : "Create"}{" "}
            fundraiser
          </h2>
          {/* Tabs Header */}
          <div className="w-full flex flex-row gap-3 my-10 items-center justify-center ">
            {TABS &&
              TABS.map((tab, index) => {
                return (
                  <button
                    type="button"
                    onClick={() => handleTabClick(tab)}
                    disabled={tab === TABS[3] && !gotoShare}
                    key={index}
                    className={`outline-none disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-[114px] min-w-fit lg:px-0 px-4 max-w-fit cursor-pointer
                            text-[16px] font-medium text-[#A3D8D7] font-signika text-center py-1.5 border-b-2 border-b-[#A3D8D7] ${activeTab === tab && "border-b-black !text-black "} `}
                  >
                    {tab}
                  </button>
                );
              })}
          </div>
          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="flex-1 overflow-x-hidden  hide-scrollbar  "
          >
            {/* INFO    */}
            {activeTab === TABS[0] && (
              <div className="w-full flex flex-col gap-8">
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium flex items-center gap-1 text-[#1E293B] uppercase ">
                    Name*&nbsp;
                  </strong>
                  <Controller
                    control={control}
                    name="studentName"
                    render={({ field }) => (
                      <React.Fragment>
                        <label className="w-full gap-1 flex items-center justify-start bg-white rounded-3xl px-3 border border-[#CBD5E1] min-h-[40px]">
                          <input
                            type="text"
                            className="flex-1 line-clamp-1 truncate text-ellipsis outline-none border-none placeholder:text-[#3B3B3B99] text-primary-black text-[16px] font-normal font-signika"
                            placeholder="Your name"
                            {...field}
                            maxLength={MAX_STUDENT_NAME_CHARCTERS}
                          />
                        </label>
                      </React.Fragment>
                    )}
                  />
                  <span className="text-[#3B3B3B99] font-normal  font-signika text-[14px] text-start ">
                    {watch("studentName")?.length || 0} of{" "}
                    {MAX_STUDENT_NAME_CHARCTERS} characters
                  </span>
                </div>
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium flex items-center gap-1 text-[#1E293B] uppercase ">
                    Institution&nbsp;
                    <span className=" font-medium text-[12px] ">{`(Optional)`}</span>
                  </strong>
                  <Controller
                    control={control}
                    name="institution"
                    render={({ field }) => (
                      <React.Fragment>
                        <label className="w-full gap-1 flex items-center justify-start bg-white rounded-3xl px-3 border border-[#CBD5E1] min-h-[40px]">
                          <input
                            type="text"
                            className="flex-1 line-clamp-1 truncate text-ellipsis outline-none border-none placeholder:text-[#3B3B3B99] text-primary-black text-[16px] font-normal font-signika"
                            placeholder="Institution"
                            {...field}
                            maxLength={MAX_STUDENT_NAME_CHARCTERS}
                          />
                        </label>
                      </React.Fragment>
                    )}
                  />
                  <span className="text-[#3B3B3B99] font-normal  font-signika text-[14px] text-start ">
                    {watch("institution")?.length || 0} of{" "}
                    {MAX_STUDENT_NAME_CHARCTERS} characters
                  </span>
                </div>
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium flex items-center gap-1 text-[#1E293B] uppercase ">
                    Short Bio&nbsp;
                    <span className=" font-medium text-[12px] ">{`(Optional)`}</span>
                  </strong>
                  <Controller
                    control={control}
                    name="studentBio"
                    render={({ field }) => (
                      <React.Fragment>
                        <label className="w-full gap-1 flex items-center justify-start bg-white rounded-3xl px-3 border border-[#CBD5E1] min-h-[40px]">
                          <input
                            type="text"
                            className="flex-1 line-clamp-1 truncate text-ellipsis outline-none border-none placeholder:text-[#3B3B3B99] text-primary-black text-[16px] font-normal font-signika"
                            placeholder="Short Bio"
                            {...field}
                            maxLength={MAX_STUDENT_BIO_CHARCTERS}
                          />
                        </label>
                      </React.Fragment>
                    )}
                  />
                  <span className="text-[#3B3B3B99] font-normal  font-signika text-[14px] text-start ">
                    {watch("studentBio")?.length || 0} of{" "}
                    {MAX_STUDENT_BIO_CHARCTERS} characters
                  </span>
                </div>
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium text-[#1E293B] uppercase ">
                    Upload Image&nbsp;
                    <span className=" font-medium text-[12px] ">{`(Optional)`}</span>
                  </strong>
                  <Controller
                    control={control}
                    name="bannerImage"
                    rules={{
                      required: "bannerImage is required",
                      minLength: {
                        value: 5,
                        message:
                          "bannerImage must be at least 2 characters long",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <React.Fragment>
                        <label className="w-full overflow-x-hidden flex flex-row gap-3 items-center ">
                          <div
                            className={`
                                                        bg-white flex-1 line-clamp-1 flex flex-row gap-3  truncate text-ellipsis  rounded-3xl p-3 outline-none border border-[#CBD5E1] min-h-[40px] placeholder:text-[#3B3B3B99] text-[#3B3B3B] text-sm font-semibold relative 
                                                        ${errors.bannerImage && errors.bannerImage?.message ? "border-red-500" : "to-blue-600"}
                                                        `}
                          >
                            <p className="text-[#3B3B3B99] flex-1 font-normal text-[16px] ">
                              {value
                                ? "Image selected"
                                : "This image will be used as the banner image"}
                            </p>
                            <input
                              type="file"
                              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // onChange(file?.name); // Update the field value
                                  getBannerImage(file);
                                }
                              }}
                            />
                            <Paperclip size={20} color={"#E7F8F8"} />
                          </div>
                          {!watch("bannerImage") ? (
                            <Upload className="cursor-pointer" />
                          ) : (
                            <X
                              onClick={(e: any) => {
                                e?.preventDefault();
                                e?.stopPropagation();
                                setValue("bannerImage", "", {
                                  shouldValidate: true,
                                });
                              }}
                              className="cursor-pointer"
                            />
                          )}
                        </label>
                        {watch("bannerImage") && (
                          <div className="w-[150px] h-[150px] rounded-md bg-gray-100 overflow-hidden">
                            <Image
                              src={watch("bannerImage") || ""}
                              alt="img"
                              width={150}
                              height={150}
                              className="w-full h-full"
                              loading="eager"
                            />
                          </div>
                        )}
                        {errors &&
                          errors.projectId &&
                          errors.projectId?.message && (
                            <p className="text-[#F87171] text-sm font-medium ">
                              {errors.projectId.message ||
                                "bannerImage must be at least 2 characters long selected"}
                            </p>
                          )}
                      </React.Fragment>
                    )}
                  />
                </div>
              </div>
            )}

            {/* ABOUT */}
            {activeTab === TABS[1] && (
              <div className="w-full flex flex-col gap-8">
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium flex items-center gap-1 text-[#1E293B] uppercase ">
                    dates*&nbsp;
                    <span className=" font-medium text-[12px] ">{`(Fundraiser can be upto ${user?.role === "ca" ? 12 : 3} months long)`}</span>
                  </strong>
                  <div className="w-full flex flex-row flex-wrap gap-3">
                    <Controller
                      name="startDate"
                      control={control}
                      rules={{
                        required: "StatDate is required",
                        minLength: {
                          value: 3,
                          message:
                            "StatDate must be at least 3 characters long",
                        },
                      }}
                      render={({ field }) => (
                        <React.Fragment>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`bg-white flex flex-row items-center flex-1  
                                                                rounded-3xl px-3 outline-none border border-[#CBD5E1] ${errors.startDate && errors.startDate?.message && "border-red-500"} min-h-[40px]
                                                                     placeholder:text-[#3B3B3B99] text-[#3B3B3B] text-sm font-semibold`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 " />
                                <p
                                  className={`flex-1 text-start truncate line-clamp-1 text-ellipsis `}
                                >
                                  {field?.value
                                    ? new Date(
                                        field?.value,
                                      ).toLocaleDateString()
                                    : "Select date"}
                                </p>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-0 bg-white rounded-xl ">
                              <Calendar
                                mode="single"
                                selected={
                                  field?.value
                                    ? new Date(field?.value)
                                    : undefined
                                }
                                onSelect={(date: any) => {
                                  field?.onChange(
                                    date ? date.toISOString() : "",
                                  );
                                  trigger("startDate");
                                  // setValue("startDate", new Date(date).toISOString());
                                }}
                                initialFocus
                                fromDate={today}
                                toDate={threeMonthsLater}
                              />
                            </PopoverContent>
                          </Popover>
                        </React.Fragment>
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={control}
                      rules={{
                        required: "endDate is required",
                        minLength: {
                          value: 3,
                          message: "endDate must be at least 3 characters long",
                        },
                      }}
                      render={({ field }) => (
                        <React.Fragment>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={`bg-white flex flex-row items-center flex-1  
                                                                rounded-3xl px-3 outline-none border border-[#CBD5E1] ${errors.endDate && errors.endDate?.message && "border-red-500"} min-h-[40px]
                                                                     placeholder:text-[#3B3B3B99] text-[#3B3B3B] text-sm font-semibold`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4 " />
                                <p
                                  className={`flex-1 text-start truncate line-clamp-1 text-ellipsis `}
                                >
                                  {field?.value
                                    ? new Date(
                                        field?.value,
                                      ).toLocaleDateString()
                                    : "Select date"}
                                </p>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-0 bg-white rounded-xl ">
                              <Calendar
                                mode="single"
                                selected={
                                  field?.value
                                    ? new Date(field?.value)
                                    : undefined
                                }
                                onSelect={(date: any) => {
                                  field?.onChange(
                                    date ? date.toISOString() : "",
                                  );
                                  trigger("endDate");
                                  // setValue("endDate", new Date(date).toISOString());
                                }}
                                initialFocus
                                fromDate={new Date(watch("startDate"))}
                                toDate={
                                  user?.role === "ca"
                                    ? oneYearLater
                                    : threeMonthsLater
                                }
                              />
                            </PopoverContent>
                          </Popover>
                        </React.Fragment>
                      )}
                    />
                  </div>
                  {watch("endDate") && watch("startDate") && (
                    <span className="text-[#3B3B3B] text-[14px] font-normal font-signika ">
                      {
                        getTimelineInfo({
                          startDate: new Date(watch("startDate")).toISOString(),
                          endDate: new Date(watch("endDate"))?.toISOString(),
                        }).totalDays
                      }
                      days to fundraise
                    </span>
                  )}
                </div>
                <div className="w-full flex flex-col gap-1 relative ">
                  <strong className="font-signika cursor-pointer text-[16px] font-medium text-[#1E293B] uppercase ">
                    Select a center*
                  </strong>
                  <Controller
                    control={control}
                    name="projectId"
                    rules={{
                      required: "project is required",
                      maxLength: {
                        value: 3,
                        message: "project  must be selected",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <React.Fragment>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild className="">
                            <div
                              className={`
                                                            bg-white line-clamp-16 cursor-pointer flex flex-row items-center text-ellipsis rounded-3xl p-3 outline-none border border-[#CBD5E1] 
                                                                                min-h-[40px] placeholder:text-[#3B3B3B99] text-[#3B3B3B] text-sm font-semibold resize-none 
                                                                                ${errors.projectId && errors.projectId?.message && "border-red-500"}
                                                            `}
                            >
                              <p
                                className={`flex-1 text-[16px] cursor-pointer font-calluna font-normal font-calluna line-clamp-1 ${value && selectedProject && selectedProject.schoolName ? "text-[#1E293B]" : "text-[#3B3B3B99]"}  truncate text-ellipsis `}
                              >
                                {value &&
                                selectedProject &&
                                selectedProject.schoolName
                                  ? selectedProject.schoolName || "N/A"
                                  : "Select a center"}
                              </p>
                              <ChevronDown size={24} color={"#CBD5E1"} />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="border overflow-y-auto border-gray-200 shadow-2xl flex flex-col rounded-xl p-3 bg-white max-h-[250px] w-full gap-2 hide-scrollbar "
                          >
                            {publicProjects &&
                              publicProjects?.length > 0 &&
                              publicProjects.map((project, index) => (
                                <DropdownMenuItem
                                  key={index}
                                  onSelect={(event) => {
                                    onChange(project._id);
                                    setSelectedProject(project);
                                  }}
                                  className="text-start !w-full cursor-pointer text-sm font-semibold text-[#3B3B3B] hover:bg-teal-300 py-1 px-2 rounded-sm "
                                >
                                  <p className="text-start w-full truncate text-ellipsis ">
                                    {project?.center_type === "village"
                                      ? project?.title ||
                                        project?.address?.villageName ||
                                        "N/A"
                                      : project.schoolName ||
                                        project.title ||
                                        project.address?.villageName ||
                                        "N/A"}
                                  </p>
                                </DropdownMenuItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {errors &&
                          errors.projectId &&
                          errors.projectId?.message && (
                            <p className="text-[#F87171] text-sm font-medium ">
                              {errors.projectId.message ||
                                "project  must be selected"}
                            </p>
                          )}
                      </React.Fragment>
                    )}
                  />
                </div>
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium text-[#1E293B] uppercase ">
                    goal*
                  </strong>
                  <div className="">
                    <Controller
                      control={control}
                      name="currency_type"
                      rules={{ required: true }}
                      render={({ field }) => (
                        <div className="w-full flex items-center gap-3 flex-wrap my-2">
                          {currencyTabs &&
                            currencyTabs.length > 0 &&
                            currencyTabs.map((item, index: number) => (
                              <div
                                key={index}
                                onClick={() => {
                                  setActiveCurrency(item.value);
                                  setValue("currency_type", item.value);
                                  setToggleCurrency(false);
                                  dispatch(
                                    geolocationActions.selectedCurrency(
                                      item.value,
                                    ),
                                  );
                                }}
                                className="flex items-center gap-2 flex-row cursor-pointer"
                              >
                                <div
                                  className={`w-4 h-4 rounded-full ${field?.value === item.value ? "border-[#3B3B3B] border-4 bg-white" : "border"} border-1 border-[#3B3B3B] `}
                                ></div>
                                <span
                                  className={`text-[#141619] cursor-pointer text-[10px] font-weight-body-1 font-calluna `}
                                >
                                  {item?.value}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    control={control}
                    name="goal"
                    rules={{
                      required: "Goal is required",
                      minLength: {
                        value: 2,
                        message: "Goal must be at least 3 characters long",
                      },
                    }}
                    render={({ field: { value, onChange } }) => (
                      <React.Fragment>
                        <label className="w-full gap-1 flex items-center justify-start bg-white rounded-3xl px-3 border-[#CBD5E1] min-h-[40px]">
                          <span className="text-primary-black text-[16px] font-normal font-signika">
                            {coverFormatedCurrency(0, activeCurrency)[0] || "₹"}
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            pattern="^[0-9,]*$"
                            className="flex-1 line-clamp-1 truncate text-ellipsis outline-none border-none placeholder:text-[#3B3B3B99] text-primary-black text-[16px] font-normal font-signika"
                            placeholder="10,000"
                            value={
                              value ? Number(value).toLocaleString("en-IN") : ""
                            }
                            onChange={(e) => {
                              // Remove commas and non-numeric characters
                              const raw = e.target.value.replace(/[^0-9]/g, "");
                              const cleaned = raw.replace(/^0+(?!$)/, ""); // remove leading zeros

                              if (cleaned === "") {
                                onChange(0);
                                setValue("goal", 0);
                              } else {
                                const parsed = parseInt(cleaned, 10);
                                onChange(parsed);
                                setValue("goal", parsed);
                              }
                            }}
                          />
                        </label>
                      </React.Fragment>
                    )}
                  />
                </div>
              </div>
            )}

            {activeTab === TABS[2] && (
              <div className="w-full flex flex-col gap-8">
                <Controller
                  control={control}
                  name="title"
                  rules={{
                    required: "Title is required",
                    minLength: {
                      value: 3,
                      message: "Title must be at least 3 characters long",
                    },
                  }}
                  render={({ field }) => (
                    <div className="w-full flex flex-col gap-1 ">
                      <strong className="font-signika text-[16px] font-medium text-[#1E293B] uppercase ">
                        Name*
                      </strong>
                      <input
                        type="text"
                        className="bg-white line-clamp-1 truncate text-ellipsis rounded-3xl px-3
                                                     outline-none border border-[#CBD5E1] min-h-[40px] placeholder:text-[#3B3B3B99] font-calluna text-[#3B3B3B] text-[16px] font-normal"
                        placeholder="Enter the title of your campaign"
                        {...field}
                      />
                      {errors && errors.title && errors.title?.message && (
                        <p className="text-[#F87171] text-sm font-medium ">
                          {errors.title.message ||
                            "Title must be at least 3 characters"}
                        </p>
                      )}
                    </div>
                  )}
                />
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-calluna text-[16px] font-normal text-[#1E293B] uppercase ">
                    reason*
                  </strong>
                  <Controller
                    control={control}
                    name="reason"
                    rules={{
                      required: "reason is required",
                      minLength: {
                        value: 3,
                        message: "reason must be selected",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <React.Fragment>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild className="">
                            <div
                              className="bg-white cursor-pointer rounded-3xl px-3 py-2 outline-none border border-[#CBD5E1] min-h-[40px]
                                                                 placeholder:text-[#3B3B3B99] text-[#3B3B3B] relative 
                                                                 flex items-center justify-between w-full flex-row
                                                                 "
                            >
                              <p
                                className={`text-[16px] font-calluna font-normal line-clamp-1 truncate text-ellipsis ${value ? "text-[#1E293B]" : "text-[#3B3B3B99]"} `}
                              >
                                {value ||
                                  "Choose a reason for creating the fundraiser"}
                              </p>
                              <ChevronDown size={24} color={"#CBD5E1"} />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="border border-gray-200 shadow-2xl flex flex-col rounded-xl p-3 bg-white w-full gap-2"
                          >
                            {ReasonsList.map((reason, index) => (
                              <DropdownMenuItem
                                key={index}
                                onClick={() => {
                                  onChange(reason);
                                }}
                                className="text-start !w-full cursor-pointer text-sm font-semibold text-[#3B3B3B] hover:bg-teal-300 py-1 px-2 rounded-sm "
                              >
                                <p className="text-start w-full">{reason}</p>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {watch("reason") === "Other" && (
                          <div className="w-full max-w-ful flex flex-row gap-2">
                            <textarea
                              className="bg-white line-clamp-1  text-ellipsis rounded-xl px-3 py-1
                                                                outline-none border border-[#CBD5E1] min-h-[40px] placeholder:text-[#3B3B3B99] font-signika
                                                                text-primary-black text-[16px] font-normal resize-none flex-1 cursor-pointer break-all "
                              placeholder="Add your reason"
                              maxLength={MAX_STUDENT_NAME_CHARCTERS}
                              value={otherReasonText}
                              onChange={(e) =>
                                setOtherReasonText(e.target.value || "")
                              }
                            />
                            <button
                              onClick={() => {
                                setValue("reason", "");
                                setOtherReasonText("");
                              }}
                              type="button"
                              className="text-primary-black flex-shrink-0 size-8 rounded-full bg-white border border-[#CBD5E1] flex flex-col items-center justify-center cursor-pointer"
                            >
                              <X
                                size={20}
                                className="text-primary-black cursor-pointer"
                              />
                            </button>
                          </div>
                        )}
                        {watch("reason") === "Other" && (
                          <span className="text-[#3B3B3B99] font-normal  font-signika text-[14px] text-start ">
                            {otherReasonText?.length || 0} of{" "}
                            {MAX_STUDENT_NAME_CHARCTERS} characters
                          </span>
                        )}
                        {errors && errors.reason && errors.reason?.message && (
                          <p className="text-[#F87171] text-sm font-medium ">
                            {errors.reason.message || "reason must be selected"}
                          </p>
                        )}
                      </React.Fragment>
                    )}
                  />
                </div>
                <div className="w-full flex flex-col gap-1 ">
                  <strong className="font-signika text-[16px] font-medium text-[#1E293B] uppercase ">
                    your story* <span className="text-[12px]"> </span>
                  </strong>
                  <Controller
                    control={control}
                    name="story"
                    rules={{
                      required: "story is required",
                      maxLength: {
                        value: MAX_CHARCTERS,
                        message: "story must be at least 350 characters",
                      },
                      minLength: {
                        value: 20,
                        message: "story must be at least 20 characters",
                      },
                    }}
                    render={({ field: { onChange, value } }) => (
                      <React.Fragment>
                        <textarea
                          aria-multiline="true"
                          className="bg-white min-h-[150px] line-clamp-16  text-ellipsis rounded-2xl p-3 outline-none border border-[#CBD5E1] 
                                                     placeholder:text-[#3B3B3B99] text-[#1E293B] text-sm font-normal resize-none  font-calluna "
                          placeholder="Why contributing to this particular cause matters to you?"
                          maxLength={MAX_CHARCTERS}
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                        />
                        {errors && errors.story?.message && (
                          <p className="text-[#F87171] text-sm font-medium ">
                            {errors.story?.message}
                          </p>
                        )}
                        <span className="text-[#3B3B3B99] font-normal font-signika text-[14px] text-start ">
                          {value?.length || 0} of 350 characters
                        </span>
                      </React.Fragment>
                    )}
                  />
                </div>
              </div>
            )}

            {/* SHARE */}
            {activeTab === TABS[3] && (
              <div className="w-full flex flex-col gap-8">
                <div className="bg-[#e6f9f9] rounded-lg max-w-md ">
                  <hr className="border-t border-[#ccecec] my-8" />
                  {/* Spread the Love Section  */}
                  <div className="w-full flex flex-col gap-3 ">
                    <div className="flex-1">
                      <p className="font-semibold text-[24px] font-signika text-[#3B3B3B]  ">
                        Spread the word
                      </p>
                      <p className="font-normal text-[20px] font-signika text-[#3B3B3B]">
                        Share the fundraiser with people that you think can help
                        contribute.
                      </p>
                    </div>

                    <hr className="border-t border-[#ccecec] my-8" />

                    {/* Share and Copy Buttons  */}
                    <div className="flex items-center flex-row gap-2">
                      <button
                        onClick={() => handleShareButton()}
                        type="button"
                        className=" w-[44px] h-[44px] flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50 rounded-full border border-[#3B3B3B]"
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10.1141 4.49112C10.1902 3.69599 11.0203 3.04172 11.8571 3.51856C13.597 4.53773 15.2394 5.69825 16.8271 6.94049C18.7862 8.48751 20.3603 9.94706 21.4737 11.1124C21.9575 11.6189 21.9118 12.42 21.4496 12.9037C20.3535 14.0504 19.1732 15.1172 17.9553 16.1321C16.0168 17.7188 14.0104 19.257 11.8253 20.4902C11.0838 20.9084 10.2812 20.4301 10.138 19.689L10.1215 19.576L9.894 16.002C8.07832 16.0402 6.31999 16.6644 4.91368 17.8247L4.64911 18.0473C4.60595 18.0827 4.56327 18.1173 4.52106 18.1511L4.27354 18.3432C4.23325 18.3735 4.19344 18.4028 4.15412 18.4312L3.92411 18.5904C3.84941 18.6396 3.7767 18.6849 3.70601 18.7261L3.50004 18.8374C2.53411 19.314 2 18.8923 2 17C2 12.5959 5.24521 8.67742 9.63167 8.08307L9.891 8.05196L10.1141 4.49112ZM12.0229 5.96524L11.8314 9.43709C11.8178 9.68226 11.6283 9.88133 11.3841 9.90684L10.0227 10.0491C6.95767 10.4148 4.52633 12.8111 4.0752 15.9432C5.56496 14.8456 7.33483 14.1777 9.21039 14.0308L9.60656 14.0076L11.311 13.9716C11.5806 13.966 11.8061 14.175 11.8208 14.4442L12.0177 18.0397C13.6209 17.0186 15.1491 15.8442 16.6817 14.5901C17.6714 13.765 18.6261 12.9036 19.5391 11.9946L19.2812 11.7394L18.7253 11.2059C17.8517 10.3839 16.8006 9.46812 15.5911 8.51285C14.4254 7.60097 13.2427 6.74514 12.0229 5.96524Z"
                            fill="#3B3B3B"
                          />
                        </svg>
                      </button>
                      <div className="relative   ">
                        <button
                          onClick={() => handleCopyClick()}
                          type="button"
                          className=" w-[44px] h-[44px] flex cursor-pointer items-center justify-center rounded-full border border-[#3B3B3B] relative "
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http:www.w3.org/2000/svg"
                          >
                            <path
                              d="M18.3652 15.5362L16.9512 14.1202L18.3652 12.7062C19.2961 11.7671 19.8171 10.4976 19.8142 9.17527C19.8113 7.85298 19.2848 6.58568 18.3498 5.65068C17.4148 4.71568 16.1475 4.18912 14.8252 4.18623C13.5029 4.18333 12.2333 4.70434 11.2942 5.63523L9.87923 7.05023L8.46523 5.63623L9.87923 4.22223C11.1921 2.90941 12.9726 2.17188 14.8292 2.17188C16.6858 2.17188 18.4664 2.90941 19.7792 4.22223C21.0921 5.53505 21.8296 7.31562 21.8296 9.17223C21.8296 11.0288 21.0921 12.8094 19.7792 14.1222L18.3652 15.5362ZM15.5362 18.3642L14.1222 19.7782C12.8094 21.0911 11.0288 21.8286 9.17223 21.8286C7.31562 21.8286 5.53505 21.0911 4.22223 19.7782C2.90941 18.4654 2.17188 16.6848 2.17188 14.8282C2.17187 12.9716 2.90941 11.1911 4.22223 9.87823L5.63723 8.46423L7.05123 9.88023L5.63723 11.2942C4.7191 12.2358 4.2089 13.5012 4.21714 14.8163C4.22538 16.1313 4.7514 17.3902 5.68126 18.3202C6.61111 19.2502 7.86992 19.7764 9.185 19.7848C10.5001 19.7933 11.7655 19.2832 12.7072 18.3652L14.1222 16.9512L15.5362 18.3642ZM14.8292 7.75723L16.2442 9.17223L9.17223 16.2422L7.75823 14.8282L14.8292 7.75723Z"
                              fill="#3B3B3B"
                            />
                          </svg>
                        </button>
                        {copied && (
                          <div className="absolute bottom-12 bg-white shadow-md border-1 border-gray-200 left-0 w-fit max-w-52 h-fit z-50 bg-teal rounded-2xl px-3 py-1 text-[#3B3B3B] font-calluna font-medium">
                            Copied
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <hr className="border-t border-[#ccecec] my-8" />
                  {/* <div className="py-10 w-full flex flex-row gap-12 items-center justify-center lg:justify-start">
                                        <Link
                                            href={`https://www.instagram.com/${encodeURIComponent(shareLink)}`}
                                            target='_blank'
                                            rel="noopener noreferrer"
                                            className='outline-none cursor-pointer ' >
                                            <Image
                                                src={"assets/images/instagram.svg"}
                                                alt="instagram"
                                                width={24}
                                                height={24}
                                            />
                                        </Link>
                                        <Link
                                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`}
                                            target='_blank'
                                            rel="noopener noreferrer"
                                            className='outline-none cursor-pointer ' >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M20.9 2H3.1C2.80826 2 2.52847 2.11589 2.32218 2.32218C2.11589 2.52847 2 2.80826 2 3.1V20.9C2 21.1917 2.11589 21.4715 2.32218 21.6778C2.52847 21.8841 2.80826 22 3.1 22H12.68V14.25H10.08V11.25H12.68V9C12.6261 8.47176 12.6885 7.93813 12.8627 7.43654C13.0369 6.93495 13.3188 6.47755 13.6885 6.09641C14.0582 5.71528 14.5068 5.41964 15.0028 5.23024C15.4989 5.04083 16.0304 4.96225 16.56 5C17.3383 4.99463 18.1163 5.03469 18.89 5.12V7.82H17.3C16.04 7.82 15.8 8.42 15.8 9.29V11.22H18.8L18.41 14.22H15.8V22H20.9C21.0445 22 21.1875 21.9715 21.321 21.9163C21.4544 21.861 21.5757 21.78 21.6778 21.6778C21.78 21.5757 21.861 21.4544 21.9163 21.321C21.9715 21.1875 22 21.0445 22 20.9V3.1C22 2.95555 21.9715 2.81251 21.9163 2.67905C21.861 2.54559 21.78 2.42433 21.6778 2.32218C21.5757 2.22004 21.4544 2.13901 21.321 2.08373C21.1875 2.02845 21.0445 2 20.9 2Z" fill="#3B3B3B" fillOpacity="0.8" />
                                            </svg>
                                        </Link>
                                        <Link
                                            target='_blank'
                                            rel="noopener noreferrer"
                                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}`}
                                            className='outline-none cursor-pointer ' >
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M19.7778 2C20.3671 2 20.9324 2.23413 21.3491 2.65087C21.7659 3.06762 22 3.63285 22 4.22222V19.7778C22 20.3671 21.7659 20.9324 21.3491 21.3491C20.9324 21.7659 20.3671 22 19.7778 22H4.22222C3.63285 22 3.06762 21.7659 2.65087 21.3491C2.23413 20.9324 2 20.3671 2 19.7778V4.22222C2 3.63285 2.23413 3.06762 2.65087 2.65087C3.06762 2.23413 3.63285 2 4.22222 2H19.7778ZM19.2222 19.2222V13.3333C19.2222 12.3727 18.8406 11.4513 18.1613 10.772C17.482 10.0927 16.5607 9.71111 15.6 9.71111C14.6556 9.71111 13.5556 10.2889 13.0222 11.1556V9.92222H9.92222V19.2222H13.0222V13.7444C13.0222 12.8889 13.7111 12.1889 14.5667 12.1889C14.9792 12.1889 15.3749 12.3528 15.6666 12.6445C15.9583 12.9362 16.1222 13.3319 16.1222 13.7444V19.2222H19.2222ZM6.31111 8.17778C6.80618 8.17778 7.28098 7.98111 7.63104 7.63104C7.98111 7.28098 8.17778 6.80618 8.17778 6.31111C8.17778 5.27778 7.34444 4.43333 6.31111 4.43333C5.81309 4.43333 5.33547 4.63117 4.98332 4.98332C4.63117 5.33547 4.43333 5.81309 4.43333 6.31111C4.43333 7.34444 5.27778 8.17778 6.31111 8.17778ZM7.85556 19.2222V9.92222H4.77778V19.2222H7.85556Z" fill="#3B3B3B" fillOpacity="0.8" />
                                            </svg>
                                        </Link>
                                        <Link
                                            target='_blank'
                                            rel="noopener noreferrer"
                                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                                                "Donate your support to Community for Water organisation. Provide a better life to our future generation: " + shareLink
                                            )}`}
                                            className='outline-none cursor-pointer  ' >

                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <g clipPath="url(#clip0_495_1959)">
                                                    <path d="M11.8656 8.46875L19.1509 0H17.4244L11.0988 7.35313L6.04625 0H0.21875L7.85906 11.1194L0.21875 20H1.94531L8.62563 12.2348L13.9613 20H19.7887L11.8652 8.46875H11.8656ZM9.50094 11.2172L8.72672 10.11L2.56734 1.29969H5.21922L10.1897 8.41L10.9637 9.51719L17.4252 18.7594H14.7736L9.50094 11.2177V11.2172Z" fill="#3B3B3B" fillOpacity="0.8" />
                                                </g>
                                                <defs>
                                                    <clipPath id="clip0_495_1959">
                                                        <rect width="20" height="20" fill="white" />
                                                    </clipPath>
                                                </defs>
                                            </svg>

                                        </Link>
                                    </div> */}
                </div>
              </div>
            )}

            {(activeTab === "Info" || activeTab === "About") && (
              <button
                disabled={disableButton()}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleClick();
                }}
                className={`
                                            bg-[#A3D8D7] max-w-fit rounded-2xl cursor-pointer mt-8 uppercase 
                                            hover:bg-[#A3D1D7] transition-all ml-auto min-h-[44px] flex flex-row items-center justify-center min-w-[173px] 
                                            disabled:bg-[#A3D8D7] disabled:text-[#3B3B3B] disabled:cursor-not-allowed 
                                            disabled:pointer-events-none disabled:opacity-50 gap-3
                                            `}
              >
                {isCheckingAmoun && (
                  <div className="w-4 h-4 mr-3 border-2 md:mx-0 mx-auto border-black/80 border-primary-black border-t-transparent rounded-full animate-spin"></div>
                )}
                <p className="text-[#3B3B3B] text-[18px] font-signika font-medium">
                  {activeTab === "About" || activeTab === "Info"
                    ? "continue"
                    : "create campaign"}
                </p>
              </button>
            )}
            <div className="w-full flex md:flex-row flex-col justify-end items-center mt-4 gap-4">
              {isCreating && (
                <div className="w-6 h-6 border-3 md:mx-0 mx-auto border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              )}
              {activeTab === "Story" && (
                <button
                  type="submit"
                  disabled={!isValid || isCreating || !isValidReason}
                  className="bg-[#A3D8D7] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none max-w-fit rounded-[24px] cursor-pointer uppercase hover:bg-[#A3D1D7] transition-all 
                                    md:ml-auto md:mx-0 mx-auto min-h-[44px] px-5 flex flex-row items-center justify-center min-w-[173px]  "
                >
                  <p className="text-primary-black text-[18px] font-signika font-medium">
                    {fundraiser_id && fundraiser_id?.trim()?.length > 0
                      ? "update"
                      : "create"}{" "}
                    Fundraise
                  </p>
                </button>
              )}
            </div>
          </form>
        </div>

        <div className=" hidden screen1330:block bg-[#E7F8F8]  rounded-xl overflow-hidden relative ">
          {/* <Image src={DrinkingGirls} alt="Logo"
    className="h-full w-full" width={40} height={53} /> */}
          {isImageLoading && isImageLoading !== true && (
            <div className=" absolute top-0 left-0 w-full h-full flex items-center justify-center ">
              <p>image loading...</p>
            </div>
          )}
          <Image
            onLoad={() => setIsImageLoading(false)}
            src={
              "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-anonymous_DSC_6310_11zon_1749491704750-1756101835422.jpg"
            }
            alt="Logo"
            className="h-full w-full object-cover"
            width={40}
            height={53}
            loading="eager"
          />
        </div>
      </div>
      {viewAllImages && (
        <ImageGallery
          selectedImage={watch().bannerImage || ""}
          onClose={() => setViewAllImages(false)}
          onChange={(image: string) => {
            setValue("bannerImage", image, { shouldValidate: true });
            setViewAllImages(false);
            setDefaultImages((prev) => {
              // Replace the first element with 'image'
              const newArray = [image, ...prev.slice(1)];
              // Filter duplicates, keeping first occurrences only
              const uniqueArray = newArray.filter(
                (item, index) => newArray.indexOf(item) === index,
              );
              return uniqueArray;
            });
          }}
        />
      )}
    </React.Fragment>
  );
};

export default CreateFundraise;
