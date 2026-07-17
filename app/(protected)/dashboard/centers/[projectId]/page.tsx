"use client";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";
import {
  CreditCard,
  DollarSign,
  Facebook,
  GraduationCap,
  Heart,
  Linkedin,
  MapPin,
  Plus,
  Send,
  Share2,
  Twitter,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import Image from "next/image";
import CreateProjectModal from "@/app/components/dashboard/create-project-dialog";
import { DonateDialog } from "@/app/components/dashboard/donaion-dialog";
import LoadingScreen from "@/app/components/loadingScreen";
import Link from "next/link";
import { ProjectModal } from "@/app/_types/project.types";
import { getUserById } from "@/app/helpers/user_helper";
import { UserSchema } from "@/app/_types/user.type";
import { useProjectsHook } from "@/app/lib/storeHooks/useProjects";
import { useAppSelector } from "@/app/lib/redox/hooks";
import {
  CURRENCY_VALID,
  defaultDonationAmounts,
  getCurrencySymbol,
} from "@/app/lib/redox/slices/geolocationSlice";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { UpdatesModal } from "@/app/_types/update.modal";
import { coverFormatedCurrency } from "@/app/utils/currency_coverter";
import api from "@/app/_services/api_service";
import { DonationsDocs } from "@/app/_types/dination.type";
import { useAuthStore } from "@/app/stores/authStore";
import {
  isUserIsAdminCheck,
  waterQuaityTable,
  WaterQualitytableInterface,
} from "@/lib/constants";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { canAccessCenterPermission } from "@/app/_types/admin-credential.enum";

function ProjectDetails() {
  const router = useRouter();
  const paramss = useParams();
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const { user } = useAuthStore();
  // const { location, selectedCountry } = useAppSelector((state) => state.geoLocation);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [project, setProject] = useState<ProjectModal>({} as ProjectModal);
  const [predifinedAmountDetails, setPredifinedAmountDetails] = useState<
    number[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [campaigns, setCampaigns] = useState<FundraiserSchema[]>([]);
  const [donations, setDonations] = useState<Partial<DonationsDocs>[]>([]);
  const [updates, setUpdates] = useState<UpdatesModal[]>([]);
  const [viewParameters, setViewParameters] = useState<boolean>(false);
  const [waterTable, setWaterTable] =
    useState<WaterQualitytableInterface[]>(waterQuaityTable);
  const progress = project
    ? ((project?.amountRaised || 0) / project?.totalProjectCost) * 100
    : 0;
  const [commentText, setCommentText] = useState("");

  const [organiser, setOrganiser] = useState<UserSchema | null>(null);
  const { getProjectBy_id } = useProjectsHook();
  const centerType = project?.center_type || "school";
  const centerName =
    centerType === "village"
      ? project?.address?.villageName || project?.title || "Village Center"
      : project?.schoolName || project?.title || "School Center";

  const isAdmin = isUserIsAdminCheck(user) || false;
  const { credentials } = useAdminCredentials(user?._id);
  const canAddCenter = canAccessCenterPermission(
    isAdmin,
    credentials,
    user?.role || "user",
  );

  useEffect(() => {
    setWaterTable(waterQuaityTable);
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      const response = await getProjectBy_id(
        paramss.projectId?.toString() || "",
      );
      setIsLoading(false);
      if (response) {
        return setProject(response || ({} as ProjectModal));
      } else {
        setProject({} as ProjectModal);
      }
    };
    fetchProject();
  }, [paramss?.projectId]);

  useEffect(() => {
    const projectDetails: any = project;
    const donations: any = projectDetails?.donations || [];
    setCampaigns((projectDetails?.campaigns as any) || []);
    setDonations(donations || []);
    if (
      project &&
      project?.waterQualityData !== undefined &&
      project?.waterQualityData
    ) {
      if (project.createdByUserId) {
      } else {
      }
      getOrganiser(project?.createdByUserId || "");
    }

    if (project && project?.waterQualityData) {
      const updatedWaterTable = waterQuaityTable.map((item) => {
        const apiValue = (project.waterQualityData as Record<string, any>)[
          item.key
        ];
        return {
          ...item,
          actualValue: apiValue?.toString().trim()
            ? apiValue
            : item.actualValue,
        };
      });

      setWaterTable(updatedWaterTable); // ← Don't forget to update your state!
    }
  }, [project]);

  const getOrganiser = async (user_id: string) => {
    if (!user_id) {
      return {};
    }

    const owner = await getUserById(user_id);

    if (owner) {
      setOrganiser(owner);
      return owner;
    } else {
      return {};
    }
  };

  useEffect(() => {
    let amounts =
      defaultDonationAmounts[selectedCurrency as CURRENCY_VALID] ||
      defaultDonationAmounts["INR"];
    setPredifinedAmountDetails(amounts);
  }, [selectedCurrency]);

  if (!paramss.projectId) {
    return (
      <div className="w-scree h-screen flex flex-col items-center justify-center ">
        <p>No Project Found</p>
      </div>
    );
  }
  if (paramss.projectId && !project && !isLoading) {
    return (
      <div className="w-scree h-screen flex flex-col items-center justify-center ">
        <p>No Project Found</p>
      </div>
    );
  }
  if (isLoading) {
    return <LoadingScreen />;
  }

  const hadleProjectUpdate = (updatedProject: Partial<ProjectModal>) => {
    const updatedProject1 = { ...project, ...updatedProject };
    setProject(updatedProject1);
  };

  return (
    <div className="fixed inset-0 overflow-auto z-[50] w-screen h-screen bg-white dark:bg-black">
      <div className="relative h-[50vh] bg-black">
        {project?.bannerImageUrl && (
          <Image
            src={encodeURI(project?.bannerImageUrl)}
            alt={"img"}
            width={0}
            height={0}
            className="!w-full !h-full object-cover opacity-70"
            loading="eager"
          />
        )}
        {canAddCenter && (
          <CreateProjectModal
            project={project}
            isEdited={true}
            onSuccess={(data: Partial<ProjectModal>) =>
              hadleProjectUpdate(data)
            }
          >
            <Button className="absolute top-4 right-4 z-[1000] bg-blue-500 uppercase font-normal">
              Edit Center
            </Button>
          </CreateProjectModal>
        )}
        <Button
          onClick={() => router.back()}
          className="absolute capitalize top-4 left-4 z-10 shadow-lg font-normal "
          variant={"default"}
        >
          back
        </Button>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {centerName}
            </h1>
            <p className="text-xl mb-6 w-[90%] truncate ">
              {project?.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Progress Section */}
            <Card className="p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold lowercase ">
                    {coverFormatedCurrency(
                      Math.round(project?.amountRaised || 0),
                      project?.curency_type || "INR",
                    )}
                  </h2>
                  <p className="text-gray-600 lowercase ">
                    raised of{" "}
                    {coverFormatedCurrency(
                      project?.totalProjectCost || 0,
                      project?.curency_type || "INR",
                    )}{" "}
                    goal
                  </p>
                </div>
                {/* <div className="flex gap-2">
                                    <Button variant="outline" size="icon">
                                        <Heart className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Share2 className="h-5 w-5" />
                                    </Button>
                                </div> */}
              </div>
              <Progress value={progress} className="h-2 mb-4" />
              <div className="flex gap-4 sm:flex-row flex-col !h-auto ">
                <div className="flex sm:flex-row flex-col gap-2 ">
                  <DonateDialog
                    project_id={project?._id}
                    donationAmount={selectedAmount || undefined}
                    from="project"
                  >
                    <Button
                      disabled={project?.projectStatus === "completed"}
                      className=""
                      size="lg"
                    >
                      Donate Now
                    </Button>
                  </DonateDialog>
                  {canAddCenter && (
                    <Button
                      disabled={project?.projectStatus === "completed"}
                      onClick={() =>
                        router.replace("/dashboard/create-fundraise")
                      }
                      size={"lg"}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      New Fundraisers
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {/* <Button variant="outline" size="icon">
                                        <Facebook className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Twitter className="h-5 w-5" />
                                    </Button>
                                    <Button variant="outline" size="icon">
                                        <Linkedin className="h-5 w-5" />
                                    </Button> */}
                </div>
              </div>
            </Card>

            {/* Project Details */}
            <Card className="p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">
                {centerType === "village"
                  ? "About the Village"
                  : "About the School"}
              </h2>
              <hr className="mb-6 mt-3" />
              <div className="grid grid-cols-1 xsm2:grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col items-start gap-3 ">
                  <Button className="bg-transparent hover:bg-transparent  ">
                    {centerType === "village" ? (
                      <MapPin
                        className="text-black dark:text-white"
                        size={28}
                      />
                    ) : (
                      <GraduationCap
                        className="text-black dark:text-white"
                        size={28}
                      />
                    )}
                  </Button>
                  <h2 className="text-xl font-bold mb-4 ">
                    {centerType === "village"
                      ? "Village details"
                      : "School details"}
                  </h2>
                  {centerType === "village" ? (
                    <>
                      <p className=" text-sm font-bold ">
                        Village name :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.address?.villageName || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Total population :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.population?.total || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Adults :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.population?.adults || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Children :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.population?.children || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Male :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.population?.male || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Female :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.population?.female || ""}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className=" text-sm font-bold ">
                        Name of school :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.schoolName || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Established Year :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.academicYear
                            ? new Date(
                                project.academicYear,
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        No Of Class rooms :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.numberOfClasses || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        UDISE Code :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.udiseCode || ""}
                        </span>
                      </p>
                      <h2 className="text-xl font-bold mb-4 mt-4 ">
                        Students Details
                      </h2>
                      <p className=" text-sm font-bold ">
                        Girls :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.studentCount?.girls || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Boys :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.studentCount?.boys || ""}
                        </span>
                      </p>
                      <p className=" text-sm font-bold ">
                        Total :{" "}
                        <span className="font-mono font-normal text-sm  ">
                          {project?.studentCount?.total || ""}
                        </span>
                      </p>
                    </>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3 ">
                  <Button variant={"ghost"}>
                    <MapPin />
                  </Button>
                  <h2 className="text-xl font-bold mb-4">Address</h2>
                  <p className=" text-sm font-bold ">
                    Village :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.villageName}
                    </span>
                  </p>
                  <p className=" text-sm font-bold ">
                    Mandal :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.mandalName}
                    </span>
                  </p>
                  <p className=" text-sm font-bold ">
                    District :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.districtName}
                    </span>
                  </p>
                  <p className=" text-sm font-bold ">
                    State :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.stateName}
                    </span>
                  </p>
                  <p className=" text-sm font-bold ">
                    Country :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.countryName}
                    </span>
                  </p>
                  <p className=" text-sm font-bold ">
                    Pincode :{" "}
                    <span className="font-mono font-normal text-sm  ">
                      {project?.address?.postalCode}
                    </span>
                  </p>
                  <Link
                    href={project.locationUrl || ""}
                    target={"_blank"}
                    className="text-blue-600 underline "
                  >
                    Google Map Link
                  </Link>
                </div>
              </div>
              <Separator className="my-6" />
              <div className="flex flex-col gap-4 mb-6">
                <h2 className="text-xl font-bold mb-4 ">Water Quality</h2>
                <h2 className="text-xl font-bold ">
                  Water Quality Parameters{" "}
                  <Button onClick={() => setViewParameters(!viewParameters)}>
                    View
                  </Button>{" "}
                </h2>
                {project &&
                  project.waterQualityData &&
                  waterTable &&
                  waterTable?.length > 0 &&
                  waterTable.map(
                    (item: WaterQualitytableInterface, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between p-2 border-b"
                      >
                        <span className="capitalize font-medium">
                          {item?.label}{" "}
                          <span className="text-sm">{`(${item?.idealVaue || ""})`}</span>
                        </span>
                        <span>{item?.actualValue}</span>
                      </div>
                    ),
                  )}
              </div>
              <Separator className="my-6" />
              <div className="prose max-w-none overflow-hidden ">
                <p className="mt-2 text-wrap break-words ">
                  {project?.description}
                </p>
                {/* <p className="mt-4">
                                    Through this project, we aim to:
                                </p>
                                <ul className="list-disc pl-6 mt-2">
                                    <li>Organize regular beach cleanup drives</li>
                                    <li>Support marine life rehabilitation centers</li>
                                    <li>Educate communities about ocean conservation</li>
                                    <li>Implement sustainable fishing practices</li>
                                </ul> */}
              </div>
            </Card>

            {/* Updates Section */}
            {/* <Card className="p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-6">Project Updates</h2>
                            <div className="space-y-6 max-h-96 overflow-y-auto ">
                                {(updates && updates.length > 0) && updates.map((update: UpdatesModal, index: number) => (
                                    <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0">
                                        <div className=" mb-2">
                                            <div className=""> */}
            {/* <img src="https://lh3.googleusercontent.com/a-/ALV-UjX-aDIHKfatB33hT-9sMwlnQOfjGFkKvQhXmt2DI1u3QyeIsLhuVv3dymy-hYjLL96TsI32m05zp-BTIN1WXZ2J3qpzZRCviS4p19gQLcyRVyekPvyDDSs5JJvWmpGjf5CatvQ8vQalhd7AGoThqBWIm5CszKraD1l8V0vPl7g32HL7CjXOOQ5kqT9YMT9E7O48pHzbMckWPH6gQ__c0iZyhIllU1QYY1-vqDAutVmJVFa-6CT1MnuTaMhhrLNbbH2ijgzs7znXBHYsD0XrEq023m03FjXuhnF7aHyk6byBHnx_0Q-b1HklobIcUOliFQ4Np5-3zIEtNTEx-ukdOTeQcmnl44zJ3omBYSVbrdLO4nrgKfxPBe3qtSQ8vd5-mK0V7WYDSdkkXdEcF2nnAMwpdlwIKaPPEl9rrjywPFmw_x8V5U4exTwsj825ATTRmbwlC6u0CwTy3OKaJ7XePhSwPv-dztnksqvpzZZVBD71WK03-ZGU05CKtZGYqehw_bOg6Ms1gIIc8YqIMYCXIz8OCDEogMUmaf_fYgMcl0GI_HIqNs7K4q3vSewRLIVSgG5o982BXJYkJboa54hOm2Y810jkKkA-emWZRcF2DMa8_x04KUTkrsHZgdZLfDzyIoQ66vjjGLTxylIMivTGGoGsnrkVift00_bARw_dHIh78OLNX8E9mSsNuu4_zjSIvyJ_dO0exQvyEhke4KHmhwqDbTkPApCvLrIn_IEAPX_KMHRqW-zzp2-6mqRsR56nKstP8JpAcq59njS-vSPIj4wxxnkPaIbEQ7GKFF3Q_IgBBLwGd6rGOcYTIaDQLq2akEnJxvawmTob_D2CRREogTNiscNqJ9hzeR2biSUB2SBkDTTTcXwR4k44krnvYsSi8JtqWkKQnmOxIJ5_nWlQhJjK8Dw_kA1G8K1N1b5XJBknQcxVmLIk3X9fV35hJ4G7GiEEjTrh418HEERWZoTR_UwW=s96-c" alt="" /> */}
            {/* </div>
                                            <div className="flex justify-between xsm2: items-start">
                                                <h3 className="text-xl font-semibold">{update.user?.name}</h3>
                                                <span className="text-sm text-gray-500">{(update.createdAt) && new Date(update.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 mb-4">{update.content}</p> */}
            {/* {update.images.length > 0 && (  
                                            <div className="grid md:grid-cols-2 grid-cols-1  gap-4">
                                                {update.images.map((image: string, i: number) => (
                                                    <Image
                                                        key={i}
                                                        src={image}
                                                        alt={`Update ${index + 1}`}
                                                        className="rounded-lg !w-full !h-48 object-cover"
                                                        height={198}
                                                        width={200}
                                                    />
                                                ))}
                                            </div>
                                        )} */}
            {/* </div>
                                ))}
                            </div>
                        </Card> */}

            {/* Campaigns */}
            {campaigns && campaigns?.length > 0 && (
              <h2 className="text-2xl font-bold mb-4">Active Campaigns</h2>
            )}
            <div className="grid gap-4 mb-8">
              {campaigns &&
                campaigns?.length > 0 &&
                campaigns.map((campaign: FundraiserSchema, index) => (
                  <Card
                    key={index}
                    className="p-6 max-w-[350px] overflow-hidden"
                  >
                    <h3 className="text-xl font-bold mb-2">{campaign.title}</h3>
                    <p className="text-gray-600 mb-4">{campaign.story}</p>
                    <Progress
                      value={Math.floor(
                        ((campaign?.raised || 0) / (campaign?.goal || 1)) * 100,
                      )}
                      className="h-2 mb-2"
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 break-all max-w-[350px] whitespace-pre-wrap w-full ">
                        ₹{(campaign.raised || 0).toLocaleString()} raised of ₹
                        {campaign.goal.toLocaleString()}
                      </p>
                      <DonateDialog
                        project_id={project?._id || ""}
                        campaign_id={campaign._id || ""}
                        from="campaign"
                      >
                        <Button
                          disabled={campaign?.status === "completed"}
                          variant="outline"
                          size="sm"
                        >
                          Support
                        </Button>
                      </DonateDialog>
                    </div>
                  </Card>
                ))}
            </div>

            {/* Comments Section */}
            {/* <Card className="p-6 mb-8">
                            <h2 className="text-2xl font-bold mb-6">Comments</h2>
                            <div className="flex gap-4 mb-6">
                                <Input
                                    placeholder="Write a comment..."
                                    value={commentText}
                                    onChange={(e: any) => setCommentText(e.target.value)}
                                />
                                <Button>
                                    <Send className="h-4 w-4 mr-2" />
                                    Post
                                </Button>
                            </div>
                            <div className="space-y-6 max-h-96 overflow-y-auto "> */}
            {/* {(project?.comments && project?.comments.length > 0) && project.comments.map((comment: any) => (
                                    <div key={comment.id} className="flex gap-4">
                                        <Image
                                            src={comment.user.image}
                                            alt={comment.user.name}
                                            className="!w-10 !h-10 rounded-full object-cover"
                                            width={40}
                                            height={40}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold">{comment.user.name}</h4>
                                                <span className="text-sm text-gray-500">{comment.date}</span>
                                            </div>
                                            <p className="text-gray-600 mt-1">{comment.content}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <Button variant="ghost" size="sm">
                                                    <Heart className="h-4 w-4 mr-1" />
                                                    {comment.likes}
                                                </Button>
                                                <Button variant="ghost" size="sm">Reply</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))} */}
            {/* </div>
                        </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Organizer Card */}
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {/* {
                                    (organiser && organiser.picture) && <img
                                        src={organiser.picture}
                                        alt={organiser.name}
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                } */}
                {organiser && organiser?.name && (
                  <div className="w-16 h-16 rounded-full object-cover bg-gray-100 flex flex-col items-center justify-center ">
                    {/* <span className='text-2xl' >{organiser?.name[0]}</span> */}
                    <span className="text-2xl">C</span>
                  </div>
                )}
                <div>
                  {/* {(organiser && organiser?.name) && <h3 className="font-semibold">{organiser.name}</h3>} */}
                  <h3 className="font-semibold">CPW</h3>
                  <p className="text-sm text-gray-600">Project organiser</p>
                </div>
              </div>
              {/* {(project?.organiser && project?.organiser.description) && <p className="text-gray-600 text-sm">{project.organiser.description}</p>} */}
              {/* <Button variant="outline" className="w-full mt-4">
                                Contact Organiser
                            </Button> */}
            </Card>

            {/* Donation Options */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Make a Donation</h2>
              {/* <div className="grid grid-cols-2 gap-2 mb-4"> */}
              {/* {[10, 25, 50, 100].map((amount) => (
                                    <Button
                                        key={amount}
                                        variant={selectedAmount === amount ? "default" : "outline"}
                                        onClick={() => setSelectedAmount(amount)}
                                    >
                                        ₹{amount}
                                    </Button>
                                ))} */}
              {/* </div> */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {predifinedAmountDetails.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    disabled={project?.projectStatus === "completed"}
                    variant={selectedAmount === amount ? "default" : "outline"}
                    className={`h-12 ${selectedAmount === amount ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                    onClick={() => setSelectedAmount(amount)}
                    value={amount}
                  >
                    {`${getCurrencySymbol(selectedCurrency || "INR")} ${amount}`}
                  </Button>
                ))}
              </div>
              <div className="mb-4 mt-4">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Custom Amount"
                  disabled={project?.projectStatus === "completed"}
                  className="w-full p-2 border rounded disabled:cursor-not-allowed"
                  value={
                    selectedAmount ? selectedAmount.toLocaleString("en-IN") : ""
                  }
                  onChange={(e) => {
                    // Remove commas and any non-digit character
                    const raw = e.target.value.replace(/[^0-9]/g, "");
                    const cleaned = raw.replace(/^0+(?!$)/, ""); // remove leading zeros

                    setSelectedAmount(cleaned ? parseInt(cleaned, 10) : 0);
                  }}
                />
              </div>
              <DonateDialog
                project_id={project?._id}
                donationAmount={selectedAmount || undefined}
                from="project"
              >
                <Button
                  disabled={project?.projectStatus === "completed"}
                  className="w-full mb-4"
                  size="lg"
                >
                  Continue to Payment
                </Button>
              </DonateDialog>
              <div className="flex justify-center gap-2">
                <CreditCard className="h-6 w-6 text-gray-400" />
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
            </Card>

            {/* Recent Donations */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Recent Donations</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto ">
                {donations &&
                  donations?.length > 0 &&
                  donations.map(
                    (donation: Partial<DonationsDocs>, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">
                            {donation.userDetails?.name || ""}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(
                              donation?.createdAt || "",
                            )?.toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "numeric",
                              minute: "numeric",
                              second: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="font-semibold">
                          {coverFormatedCurrency(
                            donation?.convertedAmounts?.[
                              donation?.currency || "INR"
                            ] ||
                              donation?.oringinalAmount ||
                              (donation?.amount || 0) / 100,
                            donation?.currency || "INR",
                          )}
                        </p>
                      </div>
                    ),
                  )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetails;
