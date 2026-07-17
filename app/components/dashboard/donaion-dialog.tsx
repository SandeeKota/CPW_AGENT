"use client";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Droplet,
  CreditCard,
  Heart,
  Shield,
  ChevronsUpDown,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getProgectsList } from "@/app/helpers/projectsHelper";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/app/lib/redox/hooks";
import { DonationSchema, DonationsDocs } from "@/app/_types/dination.type";
import { ProjectModal } from "@/app/_types/project.types";
import {
  CURRENCY_VALID,
  defaultDonationAmounts,
  geolocationActions,
  getCurrencySymbol,
  setSelectedCountry,
} from "@/app/lib/redox/slices/geolocationSlice";
import {
  getProjectRemainingAmount,
  useProjectsHook,
} from "@/app/lib/storeHooks/useProjects";
import { coverFormatedCurrency } from "@/app/utils/currency_coverter";
import {
  stripeMonthlypayemntHelper,
  stripepayemntHelper,
} from "@/app/helpers/payment.helper";
import { useAuthStore } from "@/app/stores/authStore";
import CountryDropdown from "../CountryDropdown";
import { DEFAULT_CONTRY_CODE } from "@/app/utils/country_codes";
import {
  getRazorepayOptions,
  verifyRazorepayPaymentAndcreateDonation,
} from "@/app/utils/api/razorepay.util";
import {
  MaximumAmount,
  MinimumaAmount,
  SupportedCurrency,
} from "@/app/stores/snackbat.type";
import { useSnackbar } from "../SnackbarContext";
import { useRouter } from "next/navigation";
import { useDonationVerifyingStore } from "@/app/stores/useVerifyingStore";
import { getFundraiserRemainingAmount } from "@/app/lib/storeHooks/useFundraisers";
import config from "@/app/config/config";
import { verifyPanForDonation } from "@/app/_services/donation.service";
import type { PanVerificationResponse } from "@/app/_types/dination.type";

const TRANS_FEE = 12.4;
const PAGE_LIMIT = 50;
const CURRENCY_TABS: CURRENCY_VALID[] = ["INR", "USD", "EUR", "GBP"];
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const normalizePhoneForDialCode = (phone: string) =>
  phone.replace(/\D/g, "").replace(/^0+/, "");
const getEmptyTaxExemptionDetails = () => ({
  name_as_per_pan: "",
  pan: "",
  address: {
    address_line: "",
    city: "",
    state: "",
    postal_code: "",
    country: "India",
  },
});

interface Props {
  children: React.ReactNode;
  project_id?: string;
  campaign_id?: string;
  donationAmount?: number;
  from: "project" | "campaign";
}

export function DonateDialog({
  children,
  project_id,
  campaign_id,
  donationAmount,
  from,
}: Props) {
  const {
    projects,
    loading,
    fetchProjects,
    totalPages,
    currentPage,
    totalCount,
    error,
  } = useProjectsHook();
  const { isVerifying, startVerifying, stopVerifying } =
    useDonationVerifyingStore();
  const [selectedProject, setSelectedProject] = useState<ProjectModal>(
    {} as ProjectModal,
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [isDedicated, setIsDedicated] = useState(false);
  const [currency_selected, setCurrencySelected] =
    useState<CURRENCY_VALID>("INR");
  const [remainingAmounts, setRemainingAmounts] = useState<any>({} as any);

  const [predifinedAmountDetails, setPredifinedAmountDetails] = useState<
    number[]
  >([]);
  const { user } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>(DEFAULT_CONTRY_CODE);
  const [lastName, setLastName] = useState<string>("");
  const dispatch = useAppDispatch();
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [successUrl, setSuccessUrl] = useState<string>("");
  const [errorUrl, setErrorUrl] = useState<string>("");
  const [pathToStripe, setPathToStripe] = useState<string>("");
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [verifiedPan, setVerifiedPan] = useState("");
  const [panVerificationResponse, setPanVerificationResponse] =
    useState<PanVerificationResponse | null>(null);
  const [panVerificationMessage, setPanVerificationMessage] = useState("");
  const [panVerificationError, setPanVerificationError] = useState("");
  const snackbar = useSnackbar();
  const router = useRouter();
  useEffect(() => {
    let desiredpath: string = "";
    const origi = window.location.origin || config.DASHBOARD_URL;
    const isValid = (id?: string) => !!id && id.trim().length > 8;
    if (isValid(campaign_id)) {
      desiredpath = `${config.WEBSITE_URL}/fundraisers/${campaign_id}`;
    } else if (isValid(project_id)) {
      desiredpath = `${origi}/dashboard/centers/${project_id}`;
    } else {
      desiredpath = `${origi}/`;
    }
    setSuccessUrl(
      `${origi}/payment-status/success?redirect=${encodeURIComponent(desiredpath)}`,
    );
    setErrorUrl(
      `${origi}/payment-status/failure?redirect=${encodeURIComponent(desiredpath)}`,
    );
    setPathToStripe(desiredpath);
  }, []);

  const loadProject = async () => {
    setIsLoading(true);
    await fetchProjects();
    setIsLoading(false);
  };
  useEffect(() => {
    if (projects.length <= 0) {
      loadProject();
    }
  }, [open]);

  useEffect(() => {
    let amounts =
      defaultDonationAmounts[currency_selected as CURRENCY_VALID] ||
      defaultDonationAmounts["INR"];
    setPredifinedAmountDetails(amounts);
  }, [currency_selected]);
  useEffect(() => {
    setCurrencySelected(selectedCurrency || "INR");
  }, []);

  const form = useForm<DonationsDocs>({
    resolver: zodResolver(DonationSchema),
    defaultValues: {
      project_id: "",
      campaign_id: "",

      donationType: "oneTime",
      amount: 0, // must be at least 1 as per schema

      dedicated_name: "",
      dedicated_message: "",

      userDetails: {
        name: "",
        email: "",
        phone: "",
        first_name: "",
        last_name: "",
      },
      tax_exemption_certificate_required: false,
      tax_exemption_details: getEmptyTaxExemptionDetails(),

      createdBy: "",
      recive_updates: false,
      createdAt: new Date().toISOString(),
      coment: "",
      paymentDetails: {
        provider: "razorpay",
        stripe_payment_intent_id: "",
        razorpay_payment_id: "",
        status: "pending",
        paidAt: "",
      },
    },
  });
  const isInrDonation = currency_selected?.toUpperCase() === "INR";
  const needsTaxCertificate =
    isInrDonation && !!form.watch("tax_exemption_certificate_required");
  const watchedTaxNameAsPerPan =
    form.watch("tax_exemption_details.name_as_per_pan") || "";
  const normalizedTaxNameAsPerPan = watchedTaxNameAsPerPan.trim().toUpperCase();
  const watchedTaxPan = form.watch("tax_exemption_details.pan") || "";
  const normalizedTaxPan = watchedTaxPan.trim().toUpperCase();
  const isCurrentPanVerified =
    Boolean(panVerificationResponse) && verifiedPan === normalizedTaxPan;
  const verifiedPanDisplayName =
    panVerificationResponse?.data?.full_name?.trim() ||
    [
      panVerificationResponse?.data?.first_name,
      panVerificationResponse?.data?.middle_name,
      panVerificationResponse?.data?.last_name,
    ]
      .map((part) => part?.trim() || "")
      .filter(Boolean)
      .join(" ");

  useEffect(() => {
    selectedProject && selectedProject._id
      ? form.setValue("project_id", selectedProject._id)
      : form.setValue("project_id", "");
  }, [selectedProject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    form.setValue("currency", currency_selected || "INR", {
      shouldDirty: true,
      shouldValidate: true,
    });

    if ((currency_selected || "INR").toUpperCase() !== "INR") {
      form.setValue("tax_exemption_certificate_required", false, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("tax_exemption_details", getEmptyTaxExemptionDetails(), {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.clearErrors("tax_exemption_details");
      setVerifiedPan("");
      setPanVerificationResponse(null);
      setPanVerificationMessage("");
      setPanVerificationError("");
    }
  }, [currency_selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (projects && project_id) {
      const foundProject = projects.find(
        (p: ProjectModal) => p?._id === project_id,
      );
      if (foundProject) {
        setSelectedProject(foundProject);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project_id, projects]); // Intentionally excluding 'projects' from the dependency array

  const handleTaxCertificateChange = (checked: boolean) => {
    form.setValue("tax_exemption_certificate_required", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!checked) {
      form.setValue("tax_exemption_details", getEmptyTaxExemptionDetails(), {
        shouldDirty: true,
        shouldValidate: false,
      });
      form.clearErrors("tax_exemption_details");
      setVerifiedPan("");
      setPanVerificationResponse(null);
      setPanVerificationMessage("");
      setPanVerificationError("");
    }
  };

  const normalizePan = (value = "") => value.trim().toUpperCase();
  const normalizeNameAsPerPan = (value = "") =>
    value
      .toUpperCase()
      .replace(/[^A-Z\s]/g, "")
      .replace(/\s+/g, " ")
      .trimStart();
  const normalizePostalCode = (value = "") =>
    value.replace(/\D/g, "").slice(0, 6);

  const getPanVerificationErrorMessage = (error: any) =>
    error?.response?.data?.message ||
    error?.message ||
    "Unable to verify PAN right now.";

  const handleVerifyPan = async () => {
    const pan = normalizedTaxPan;
    const nameAsPerPan = normalizedTaxNameAsPerPan;

    if (nameAsPerPan.length < 3) {
      const message = "Name as per PAN is required.";
      setPanVerificationError(message);
      toast({
        title: "Invalid PAN details",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (!PAN_REGEX.test(pan)) {
      const message = "Enter a valid PAN.";
      setPanVerificationError(message);
      toast({
        title: "Invalid PAN",
        description: message,
        variant: "destructive",
      });
      return;
    }

    try {
      setVerifyingPan(true);
      setPanVerificationError("");
      setPanVerificationMessage("");

      const response = await verifyPanForDonation(pan, nameAsPerPan);

      if (response.success && response.verified !== false) {
        setVerifiedPan(pan);
        setPanVerificationResponse(response);
        setPanVerificationMessage(
          response.message || "PAN verified successfully.",
        );
        toast({
          title: "PAN verified",
          description:
            response.data?.full_name ||
            response.message ||
            "PAN verified successfully.",
        });
        return;
      }

      const message = response.message || "PAN is invalid.";
      setVerifiedPan("");
      setPanVerificationResponse(null);
      setPanVerificationError(message);
      toast({
        title: "PAN verification failed",
        description: message,
        variant: "destructive",
      });
    } catch (error: any) {
      const message = getPanVerificationErrorMessage(error);
      setVerifiedPan("");
      setPanVerificationResponse(null);
      setPanVerificationError(message);
      toast({
        title: "PAN verification failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setVerifyingPan(false);
    }
  };

  const isValidInTab = () => {
    if (step === 1) {
      const valid =
        form.watch("donationType") === "monthly" ||
        (form.watch("donationType") === "oneTime" &&
          form.watch("amount") &&
          form.watch("project_id"));
      return valid;
    } else {
      const taxDetails = form.watch("tax_exemption_details");
      const taxDetailsValid =
        !needsTaxCertificate ||
        Boolean(
          taxDetails?.name_as_per_pan &&
          taxDetails?.pan &&
          taxDetails?.address?.address_line &&
          taxDetails?.address?.city &&
          taxDetails?.address?.state &&
          taxDetails?.address?.postal_code &&
          taxDetails?.address?.country,
        );
      const valid =
        form.watch("userDetails.email") &&
        form.watch("userDetails.first_name") &&
        form.watch("userDetails.last_name") &&
        form.watch("userDetails.phone") &&
        taxDetailsValid;
      return valid;
    }
  };

  useEffect(() => {
    handleFetchProjectRemainingAmounts();
  }, [project_id, open, campaign_id, selectedProject]);

  useEffect(() => {
    if (campaign_id) {
      form.setValue("campaign_id", campaign_id);
    }
    if (project_id) {
      form.setValue("project_id", project_id);
    }
    if (user) {
      form.setValue(
        "userDetails.first_name",
        user.given_name && user.given_name?.trim()?.length > 0
          ? user.given_name
          : user.name?.replace(".com", "") || "",
      );
      form.setValue(
        "userDetails.last_name",
        user.family_name && user.family_name?.trim()?.length > 0
          ? user.family_name
          : user.name?.split("@")[0] || "",
      );
      form.setValue("userDetails.name", user.name || "");
      form.setValue("userDetails.email", user.email || "");
      form.setValue("createdBy", user._id || "");
      setLastName(
        user.family_name && user.family_name?.trim()?.length > 0
          ? user.family_name
          : user.name?.split("@")[0] || "",
      );
      setFirstName(
        user.given_name && user.given_name?.trim()?.length > 0
          ? user.given_name
          : user.name?.replace(/\.(com|in|org|gov|net|edu|co)$/i, "") || "",
      );
      setEmail(user.email || "");
    }
  }, [project_id, campaign_id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async () => {
    const unitAmount: number = form.getValues().amount * 100;
    if (step === 3) {
      let formData = form.getValues();
      const { project_id, amount, donationType, userDetails } = formData;
      const unitAmount: number = amount * 100;
      const currency_tyep = currency_selected || "INR";
      const isInrPayment = currency_tyep?.toUpperCase() === "INR";
      const requiresTaxCertificate =
        isInrPayment && Boolean(formData.tax_exemption_certificate_required);
      if (requiresTaxCertificate && !isCurrentPanVerified) {
        toast({
          title: "PAN verification required",
          description: "Verify PAN before completing donation.",
          variant: "destructive",
        });
        return null;
      }
      const taxExemptionDetails = requiresTaxCertificate
        ? {
            name_as_per_pan: normalizeNameAsPerPan(
              formData.tax_exemption_details?.name_as_per_pan || "",
            ),
            pan: normalizePan(formData.tax_exemption_details?.pan || ""),
            address: {
              address_line:
                formData.tax_exemption_details?.address?.address_line?.trim() ||
                "",
              city: formData.tax_exemption_details?.address?.city?.trim() || "",
              state:
                formData.tax_exemption_details?.address?.state?.trim() || "",
              postal_code: normalizePostalCode(
                formData.tax_exemption_details?.address?.postal_code || "",
              ),
              country:
                formData.tax_exemption_details?.address?.country?.trim() ||
                "India",
            },
          }
        : undefined;
      formData = {
        ...formData,
        userDetails: {
          ...formData.userDetails,
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          name: `${user?.name ? user?.name : firstName + lastName}`,
        },
        createdBy: user?._id || "",
        amount: unitAmount,
        oringinalAmount: amount,
        recive_updates: true,
        currency: currency_tyep,
        tax_exemption_certificate_required: requiresTaxCertificate,
        tax_exemption_details: taxExemptionDetails,
        pan_verification_response: requiresTaxCertificate
          ? panVerificationResponse || undefined
          : undefined,
      };

      const isValid = DonationSchema.safeParse(formData);
      if (!isValid.success) {
        const issue = isValid.error.issues?.[0];
        toast({
          title: issue?.message || "Please check the donation details.",
          variant: "destructive",
        });
        return null;
      }
      if (isValid.success) {
        setOpen(false);
        setStep(1);
        try {
          const currentUrl = pathToStripe;
          if (donationType === "monthly") {
            if (currency_tyep?.toUpperCase() === "INR") {
              const result = await handlerazorepayOneTimePayment(
                unitAmount,
                formData || {},
                user || {},
                currency_tyep?.toUpperCase() || "INR",
                currentUrl,
                currentUrl,
                currentUrl,
              );
            } else {
              const data = await stripeMonthlypayemntHelper(
                unitAmount,
                formData,
                user || {},
                currency_tyep || "USD",
                currentUrl,
                currentUrl,
                currentUrl,
              );

              if (data && data.url) {
                // window.location.href = data.url; // Redirect to Stripe
                window.open(data.url, "_blank"); // Redirect to Stripe
              } else {
                toast({
                  title: "Something went wrong",
                  description: "Please try again",
                  variant: "destructive",
                });
              }
            }
          } else {
            if (currency_tyep?.toUpperCase() === "INR") {
              const result = await handlerazorepayOneTimePayment(
                unitAmount,
                formData || {},
                user || {},
                currency_tyep?.toUpperCase() || "INR",
                currentUrl,
                currentUrl,
                currentUrl,
              );
            } else {
              const data = await stripepayemntHelper(
                unitAmount,
                formData,
                user || {},
                currency_tyep || "INR",
                currentUrl,
                currentUrl,
                currentUrl,
              );
              if (data && data.url) {
                // window.location.href = data.url; // Redirect to Stripe
                // window.open(data.url, '_blank'); // Redirect to Stripe
                window.open(data.url, "_blank"); // Redirect to Stripe
              } else {
                toast({
                  title: "Something went wrong",
                  description: "Please try again",
                  variant: "destructive",
                });
              }
            }
          }
        } catch (err) {
          console.error("Failed to redirect to checkout:", err);
        }
        // };
      }
      setOpen(false);
      setStep(1);
      form.reset();
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["amount", "donationType"]);
      if (isValid) {
        let formData = form.watch();
        const { project_id, amount, donationType, userDetails, currency } =
          formData;
        console.log("amount", amount, currency_selected);
        const minimum =
          MinimumaAmount?.[currency_selected as SupportedCurrency] || 0;
        const maximum =
          MaximumAmount?.[currency_selected as SupportedCurrency] || 0;

        const isTooSmall = amount < minimum;
        const isTooLarge = amount > maximum;

        if (isTooSmall) {
          snackbar.show(
            `Please donate at least ${coverFormatedCurrency(minimum, currency_selected || "INR")} to kick-start a child’s access to clean water.`,
            {
              type: "warning",
              position: "center",
              duration: 4000,
            },
          );
          return;
        }

        if (isTooLarge) {
          snackbar.show(
            `The maximum possible donation is ${coverFormatedCurrency(maximum, currency_selected || "INR")}. Please consider splitting your donation.`,
            {
              type: "warning",
              position: "center",
              duration: 4000,
            },
          );
          return;
        }
        setStep(2);
      }
    } else if (step === 2) {
      const step2Fields: any[] = [
        "userDetails.first_name",
        "userDetails.last_name",
        "userDetails.name",
        "userDetails.email",
        "userDetails.phone",
      ];

      if (needsTaxCertificate) {
        step2Fields.push(
          "tax_exemption_certificate_required",
          "tax_exemption_details.name_as_per_pan",
          "tax_exemption_details.pan",
          "tax_exemption_details.address.address_line",
          "tax_exemption_details.address.city",
          "tax_exemption_details.address.state",
          "tax_exemption_details.address.postal_code",
          "tax_exemption_details.address.country",
        );
      }

      const isValid = await form.trigger(step2Fields);
      if (isValid) {
        if (needsTaxCertificate && !isCurrentPanVerified) {
          const message = "Verify PAN before continuing.";
          setPanVerificationError(message);
          toast({
            title: "PAN verification required",
            description: message,
            variant: "destructive",
          });
          return;
        }
        setStep(3);
      } else {
        toast({
          title: needsTaxCertificate
            ? "Please check the highlighted details and 80G fields."
            : "Please check the highlighted details.",
          variant: "destructive",
        });
      }
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };
  useEffect(() => {
    setStep(1);
    setPhoneNumber("");
    setVerifiedPan("");
    setPanVerificationResponse(null);
    setPanVerificationMessage("");
    setPanVerificationError("");
    form.reset();
    form.setValue("project_id", selectedProject?._id || "");
    form.setValue("currency", currency_selected || "INR");
    form.setValue("tax_exemption_certificate_required", false);
    form.setValue("tax_exemption_details", getEmptyTaxExemptionDetails());
    if (user) {
      form.setValue(
        "userDetails.first_name",
        user.given_name && user.given_name?.trim()?.length > 0
          ? user.given_name
          : user.name?.replace(/\.(com|in|org|gov|net|edu|co)$/i, "") || "",
      );
      form.setValue(
        "userDetails.last_name",
        user.family_name && user.family_name?.trim()?.length > 0
          ? user.family_name
          : user.name?.split("@")[0] || "",
      );
      form.setValue("userDetails.name", user.name || "");
      form.setValue("userDetails.email", user.email || "");
      form.setValue("createdBy", user._id || "");
      setLastName(
        user.family_name && user.family_name?.trim()?.length > 0
          ? user.family_name
          : user.name?.split("@")[0] || "",
      );
      setFirstName(
        user.given_name && user.given_name?.trim()?.length > 0
          ? user.given_name
          : user.name?.replace(/\.(com|in|org|gov|net|edu|co)$/i, "") || "",
      );
      setEmail(user.email || "");
    }

    new Promise((resolve) => {
      setTimeout(() => {
        resolve("");
      }, 200);
    });
    if (donationAmount || donationAmount !== undefined) {
      form.setValue("amount", donationAmount);
    }
    campaign_id && form.setValue("campaign_id", campaign_id);
    project_id && form.setValue("project_id", project_id);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (countryCode) {
      const normalizedPhone = normalizePhoneForDialCode(phoneNumber);
      setPhoneNumber(normalizedPhone);
      form.setValue(
        "userDetails.dial_code",
        countryCode || DEFAULT_CONTRY_CODE,
        { shouldValidate: true },
      );
      form.setValue("userDetails.phone", normalizedPhone, {
        shouldValidate: true,
      });
      void form.trigger("userDetails.phone");
    } else {
      form.setValue("userDetails.dial_code", DEFAULT_CONTRY_CODE, {
        shouldValidate: true,
      });
    }
  }, [countryCode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlerazorepayOneTimePayment = async (
    amount: number = 0,
    donationMeta: DonationsDocs = {} as DonationsDocs,
    userMeta: any = {},
    currency: string = "INR",
    redirect_url: string = "",
    errorUrl: string = "",
    successUrl: string = "",
  ) => {
    try {
      const order = await getRazorepayOptions({
        amount,
        donationMeta,
        userMeta,
        currency,
        redirect_url,
        errorUrl,
        successUrl,
      });
      if (order) {
        const body = {
          amount,
          donationMeta: donationMeta,
          userMeta,
          currency,
          redirect_url,
          errorUrl,
          successUrl,
        };
        const order_id = order.orderId;
        const subscription_id = order.subscriptionId;
        let options: any = {
          key: order?.key,
          amount: order.amount || 0,
          currency: order.currency,
          name: "Community for Water",
          description: "Donation to Community for Water organization",

          notes: {
            body1: body,
            body: JSON.stringify(body),
          },
          handler: function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            onSuccessrazorepay(response, redirect_url);
          },
          prefill: {
            name: donationMeta?.userDetails?.name || "Donor",
            email: donationMeta?.userDetails?.email || "",
            contact: donationMeta?.userDetails?.phone || "",
          },
          theme: {
            color: "#0f766e",
          },
          modal: {
            ondismiss: onFailureRazorepay,
          },
        };
        if (subscription_id) {
          options = {
            ...options,
            subscription_id: subscription_id,
          };
        } else {
          options = {
            ...options,
            order_id: order_id,
          };
        }

        const razor = new (window as any).Razorpay(options);
        razor.open();
      } else {
        throw new Error("Failed to get options");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title:
          error instanceof Error
            ? error.message?.toString()
            : "Unable make these payment",
      });
    }
  };

  const onSuccessrazorepay = async (data: any, pathToStripe: string) => {
    toast({
      variant: "default",
      title: "Payment successful",
    });
    try {
      startVerifying();
      // const res = await verifyRazorepayPaymentAndcreateDonation(data);
      setTimeout(() => {
        stopVerifying();
        window.location?.reload();
      }, 3000);
    } catch (error) {
      console.error(
        "❌ Error at verifyRazorepayPaymentAndcreateDonation",
        error,
      );
      toast({
        variant: "destructive",
        title: "Payment received, but verification failed",
        description:
          "Don't worry, your donation has been received. We're verifying it on our end.",
      });
    }
  };

  const onFailureRazorepay = async (data: any) => {
    toast({
      variant: "destructive",
      title: "Payment failed",
    });
  };

  const handleFetchProjectRemainingAmounts = async () => {
    if (
      open &&
      selectedProject &&
      selectedProject?._id &&
      selectedProject?._id?.trim().length > 5 &&
      from === "project"
    ) {
      const getAmounts = async () => {
        const amountRes = await getProjectRemainingAmount(
          selectedProject?._id || "",
        );
        if (amountRes && amountRes?.remainingAmount) {
          setRemainingAmounts(amountRes?.remainingAmount || {});
        }
      };
      getAmounts();
    }
    if (
      open &&
      campaign_id &&
      campaign_id?.trim().length > 5 &&
      from === "campaign"
    ) {
      const getAmounts = async () => {
        const amountRes = await getFundraiserRemainingAmount(campaign_id || "");
        if (amountRes && amountRes?.remainingAmount) {
          setRemainingAmounts(amountRes?.remainingAmount || {});
        }
      };
      getAmounts();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] min-h-[50vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-red-500" />
            Donate to Pure Water Initiative
          </DialogTitle>
          <DialogDescription>
            Your donation helps provide clean RO water to schools and villages
            in need.
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
          <React.Fragment>
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center w-full max-w-md">
                <div
                  className={`flex-1 flex flex-col items-center ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    1
                  </div>
                  <span className="text-xs">Amount</span>
                </div>
                <div
                  className={`h-1 flex-1 ${step >= 2 ? "bg-primary" : "bg-muted"}`}
                ></div>
                <div
                  className={`flex-1 flex flex-col items-center ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    2
                  </div>
                  <span className="text-xs">Details</span>
                </div>
                <div
                  className={`h-1 flex-1 ${step >= 3 ? "bg-primary" : "bg-muted"}`}
                ></div>
                <div
                  className={`flex-1 flex flex-col items-center ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    3
                  </div>
                  <span className="text-xs">Payment</span>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e?.preventDefault();
                  e?.stopPropagation();
                  onSubmit();
                }}
                className="space-y-6"
              >
                {step === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-center mb-4">
                      <Shield className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm font-medium">
                        Secure donation
                      </span>
                    </div>

                    <FormField
                      control={form.control}
                      name="donationType"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Donation Type</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex space-x-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="oneTime" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  One-time
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="monthly" />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  Monthly
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <RadioGroup defaultValue={CURRENCY_TABS[0]}>
                      <span className="text-sm font-medium">
                        Select Currency
                      </span>
                      <div className="flex flex-row gap-2  items-center ">
                        {CURRENCY_TABS &&
                          CURRENCY_TABS.map((currency) => (
                            <div
                              key={currency}
                              className={`flex  rounded-full p-2 items-center space-x-2 cursor-pointer ${currency === currency_selected ? "bg-muted text-primary" : "bg-none text-muted-foreground"} `}
                            >
                              <label
                                onClick={() => setCurrencySelected(currency)}
                                className="text-sm cursor-pointer flex flex-row items-center justify-center gap-2 font-normal"
                                htmlFor={currency}
                              >
                                <div className="h-4 w-4 border-current border rounded-full flex items-center justify-center ">
                                  <div
                                    className={`h-3 w-3 ${currency === currency_selected && "bg-current"}  rounded-full`}
                                  ></div>
                                </div>
                                {currency}
                              </label>
                            </div>
                          ))}
                      </div>
                    </RadioGroup>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        className="border border-gray-200 rounded-md p-2 cursor-pointer mt-[10px] "
                      >
                        <div className="flex flex-row gap-2 items-center ">
                          <p className=" text-sm text-muted-foreground truncate flex-1 ">
                            {selectedProject && selectedProject.schoolName
                              ? selectedProject?.schoolName
                              : "Select a project"}
                          </p>
                          <ChevronsUpDown size={15} />
                        </div>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent
                        align={"start"}
                        className="!max-h-[300px] !overflow-hidden flex flex-col "
                      >
                        <DropdownMenuLabel>Projects</DropdownMenuLabel>

                        <div className="h-full overflow-y-auto flex-1 ">
                          {projects &&
                            projects.length > 0 &&
                            projects.map(
                              (project: ProjectModal, index: number) => (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedProject(project);
                                  }}
                                  className="cursor-pointer"
                                  key={index}
                                >
                                  <p className="truncate">
                                    {project?.center_type === "village"
                                      ? project?.title ||
                                        project?.address?.villageName
                                      : project?.schoolName}
                                  </p>
                                </DropdownMenuItem>
                              ),
                            )}
                          <p></p>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field: { onChange, value, onBlur } }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Donation Amount</FormLabel>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {predifinedAmountDetails.map((amount) => (
                                <Button
                                  key={amount}
                                  type="button"
                                  variant={
                                    value === amount ? "default" : "outline"
                                  }
                                  className={`h-12 ${value === amount ? "bg-blue-600 hover:bg-blue-700" : ""}`}
                                  onClick={() => {
                                    onChange(Number(amount));
                                  }}
                                  value={amount}
                                >
                                  {`${getCurrencySymbol(currency_selected || "INR")} ${amount}`}
                                </Button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field: { value, onChange, onBlur } }) => (
                        <FormItem>
                          <FormLabel>
                            {`Custom Amount (${getCurrencySymbol(currency_selected)})`}
                          </FormLabel>
                          <FormControl>
                            <Input
                              value={
                                value
                                  ? Number(value).toLocaleString("en-IN")
                                  : ""
                              }
                              placeholder="Enter custom amount"
                              type="text"
                              inputMode="numeric"
                              required
                              pattern="^[1-9][0-46]{0,8}$"
                              onChange={(
                                event: React.ChangeEvent<HTMLInputElement>,
                              ) => {
                                let val = event.target.value.replace(
                                  /[^0-9]/g,
                                  "",
                                ); // Remove all non-digit characters

                                // Remove leading zeros
                                val = val.replace(/^0+/, "");

                                // Allow empty string
                                if (val === "") {
                                  onChange("");
                                  return;
                                }

                                const numericValue = Number(val);
                                if (numericValue >= 1) {
                                  onChange(numericValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* {(form.watch("amount") > ((remainingAmounts?.[currency_selected || "INR"] as number) + 10)) && (
                                            <span className="text-red-600 font-signika font-medium">
                                                Your donation cannot be greater than {coverFormatedCurrency(remainingAmounts?.[currency_selected || "INR"] + 10 || 0, currency_selected || "INR")}
                                            </span>
                                        )} */}

                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium flex items-center mb-2">
                        <Droplet className="h-4 w-4 text-blue-500 mr-2" />
                        Your Impact
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Your donation of{" "}
                        {getCurrencySymbol(currency_selected || "INR")}XXXX can
                        provide clean drinking water to approximately 200 people
                        for a month.
                      </p>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="userDetails.first_name"
                        render={({ field: { value, onChange } }) => (
                          <FormItem>
                            <FormLabel>First Name*</FormLabel>
                            <FormControl>
                              <Input
                                value={value}
                                placeholder="John"
                                onChange={(e) => {
                                  onChange(e.target.value);
                                  setFirstName(e.target.value || "");
                                }}
                                className={
                                  "placeholder:text-muted-foreground !text-black "
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="userDetails.last_name"
                        render={({ field: { value, onChange } }) => (
                          <FormItem>
                            <FormLabel>Last Name*</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Doe"
                                value={value}
                                onChange={(e) => {
                                  onChange(e.target.value);
                                  setLastName(e.target.value || "");
                                }}
                                className={
                                  "placeholder:text-muted-foreground !text-black "
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="userDetails.email"
                      render={({ field: { value, onChange } }) => (
                        <FormItem>
                          <FormLabel>Email*</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="john.doe@example.com"
                              type="email"
                              value={value}
                              onChange={(e) => {
                                onChange(e.target.value);
                                setEmail(e.target.value || "");
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="userDetails.phone"
                      render={() => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <div className="w-full flex flex-row gap-2 items-start">
                            <div className="rounded-md border border-input px-2 py-1">
                              <FormField
                                control={form.control}
                                name="userDetails.dial_code"
                                render={() => (
                                  <CountryDropdown
                                    value={countryCode || DEFAULT_CONTRY_CODE}
                                    onChange={(data: any) =>
                                      setCountryCode(
                                        data || DEFAULT_CONTRY_CODE,
                                      )
                                    }
                                  />
                                )}
                              />
                            </div>
                            <div className="flex-1 space-y-2">
                              <FormControl>
                                <Input
                                  type="tel"
                                  inputMode="numeric"
                                  maxLength={15}
                                  placeholder="Phone number"
                                  value={phoneNumber}
                                  autoComplete="off"
                                  onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>,
                                  ) => {
                                    const val = normalizePhoneForDialCode(
                                      event.target.value,
                                    );
                                    setPhoneNumber(val);
                                    form.setValue("userDetails.phone", val, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                  }}
                                  onBlur={() => {
                                    const val =
                                      normalizePhoneForDialCode(phoneNumber);
                                    setPhoneNumber(val);
                                    form.setValue("userDetails.phone", val, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    });
                                    void form.trigger("userDetails.phone");
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </div>
                          </div>
                        </FormItem>
                      )}
                    />

                    {isInrDonation && (
                      <div className="space-y-4 rounded-md border p-4">
                        <FormField
                          control={form.control}
                          name="tax_exemption_certificate_required"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={Boolean(field.value)}
                                  onCheckedChange={(checked) =>
                                    handleTaxCertificateChange(checked === true)
                                  }
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>
                                  I require an 80G tax exemption certificate
                                </FormLabel>
                                <FormDescription>
                                  PAN and address are required for the 80G
                                  certificate.
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {needsTaxCertificate && (
                          <div className="space-y-4 rounded-md border border-primary/20 bg-muted/20 p-4">
                            <FormField
                              control={form.control}
                              name="tax_exemption_details.name_as_per_pan"
                              render={({
                                field: { value, onChange, onBlur },
                              }) => (
                                <FormItem>
                                  <FormLabel>Name as per PAN*</FormLabel>
                                  <FormControl>
                                    <Input
                                      value={value || ""}
                                      placeholder="Enter full name"
                                      className="uppercase"
                                      onChange={(event) => {
                                        const nextValue = normalizeNameAsPerPan(
                                          event.target.value,
                                        );
                                        event.target.value = nextValue;
                                        onChange(nextValue);
                                        setVerifiedPan("");
                                        setPanVerificationResponse(null);
                                        setPanVerificationMessage("");
                                        setPanVerificationError("");
                                      }}
                                      onBlur={(event) => {
                                        const nextValue = normalizeNameAsPerPan(
                                          event.target.value,
                                        );
                                        form.setValue(
                                          "tax_exemption_details.name_as_per_pan",
                                          nextValue,
                                          {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                          },
                                        );
                                        onBlur();
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tax_exemption_details.pan"
                              render={({
                                field: { value, onChange, onBlur },
                              }) => (
                                <FormItem>
                                  <FormLabel>PAN*</FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input
                                        value={value || ""}
                                        placeholder="ABCDE1234F"
                                        maxLength={10}
                                        className="uppercase"
                                        onChange={(event) => {
                                          const nextValue = normalizePan(
                                            event.target.value,
                                          );
                                          event.target.value = nextValue;
                                          onChange(nextValue);
                                          setVerifiedPan("");
                                          setPanVerificationResponse(null);
                                          setPanVerificationMessage("");
                                          setPanVerificationError("");
                                        }}
                                        onBlur={(event) => {
                                          const nextValue = normalizePan(
                                            event.target.value,
                                          );
                                          form.setValue(
                                            "tax_exemption_details.pan",
                                            nextValue,
                                            {
                                              shouldDirty: true,
                                              shouldValidate: true,
                                            },
                                          );
                                          onBlur();
                                        }}
                                      />
                                    </FormControl>
                                    <Button
                                      type="button"
                                      variant={
                                        isCurrentPanVerified
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="h-10 shrink-0"
                                      disabled={
                                        verifyingPan ||
                                        normalizedTaxNameAsPerPan.length < 3 ||
                                        !PAN_REGEX.test(normalizedTaxPan)
                                      }
                                      onClick={handleVerifyPan}
                                    >
                                      {verifyingPan ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : isCurrentPanVerified ? (
                                        <span className="inline-flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4" />
                                          Verified
                                        </span>
                                      ) : (
                                        "Verify PAN"
                                      )}
                                    </Button>
                                  </div>
                                  {panVerificationError && (
                                    <p className="text-xs font-medium text-rose-600">
                                      {panVerificationError}
                                    </p>
                                  )}
                                  {!panVerificationError &&
                                    isCurrentPanVerified &&
                                    (verifiedPanDisplayName ||
                                      panVerificationMessage) && (
                                      <p className="text-xs font-semibold text-emerald-700">
                                        {verifiedPanDisplayName
                                          ? `Display name: ${verifiedPanDisplayName}`
                                          : panVerificationMessage}
                                      </p>
                                    )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tax_exemption_details.address.address_line"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Address line*</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      value={field.value || ""}
                                      placeholder="House number, street, area"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="tax_exemption_details.address.city"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>City*</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value || ""}
                                        placeholder="City"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tax_exemption_details.address.state"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>State*</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value || ""}
                                        placeholder="State"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tax_exemption_details.address.postal_code"
                                render={({
                                  field: { value, onChange, onBlur },
                                }) => (
                                  <FormItem>
                                    <FormLabel>Postal code*</FormLabel>
                                    <FormControl>
                                      <Input
                                        value={value || ""}
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="500001"
                                        onChange={(event) => {
                                          const nextValue = normalizePostalCode(
                                            event.target.value,
                                          );
                                          event.target.value = nextValue;
                                          onChange(nextValue);
                                        }}
                                        onBlur={(event) => {
                                          const nextValue = normalizePostalCode(
                                            event.target.value,
                                          );
                                          form.setValue(
                                            "tax_exemption_details.address.postal_code",
                                            nextValue,
                                            {
                                              shouldDirty: true,
                                              shouldValidate: true,
                                            },
                                          );
                                          onBlur();
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tax_exemption_details.address.country"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Country*</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...field}
                                        value={field.value || "India"}
                                        placeholder="India"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={isDedicated}
                          onCheckedChange={(checked: boolean) =>
                            setIsDedicated(!isDedicated)
                          }
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Dedicate this donation</FormLabel>
                        <FormDescription>
                          Make this donation in honor or memory of someone
                          special
                        </FormDescription>
                      </div>
                    </FormItem>

                    {isDedicated && (
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="dedicated_name"
                          render={({ field: { value, onChange } }) => (
                            <FormItem>
                              <FormLabel>Dedication Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Name of the person"
                                  value={value}
                                  onChange={onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dedicated_message"
                          render={({ field: { value, onChange } }) => (
                            <FormItem>
                              <FormLabel>Dedication Message</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Your message"
                                  className="resize-none"
                                  value={value}
                                  onChange={onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="coment"
                      rules={{ required: true, minLength: 10, maxLength: 200 }}
                      render={({ field: { value, onChange } }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Input
                              required
                              placeholder="add comment here, why you are donating"
                              type="text"
                              value={value}
                              onChange={(e) => {
                                onChange(e.target.value);
                                setEmail(e.target.value || "");
                              }}
                              maxLength={200}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div className="bg-muted/50 p-4 rounded-lg mb-6">
                      <h4 className="font-medium mb-2">Donation Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Donation Type:</span>
                          <span className="font-medium">
                            {form.watch("donationType") === "oneTime"
                              ? "One-time"
                              : "Monthly"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount:</span>
                          <span className="font-medium">
                            {coverFormatedCurrency(
                              form.watch("amount"),
                              currency_selected || "INR",
                            )}
                          </span>
                        </div>
                        {isInrDonation && (
                          <div className="flex justify-between">
                            <span>80G Certificate:</span>
                            <span className="font-medium">
                              {needsTaxCertificate
                                ? "Requested"
                                : "Not requested"}
                            </span>
                          </div>
                        )}
                        {isDedicated && (
                          <div className="flex justify-between">
                            <span>Dedicated to:</span>
                            <span className="font-medium">
                              {form.watch("dedicated_name")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-sm">
                      <Shield className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">
                        Your payment information is secure and encrypted
                      </span>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                    >
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      asChild
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={!isValidInTab()}
                    >
                      <button type="button" onClick={handleNextStep}>
                        Continue
                      </button>
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!form.formState.isValid}
                      className="bg-blue-600 hover:bg-blue-700 disabled:opacity-70 "
                    >
                      Complete Donation
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </Form>
          </React.Fragment>
        )}
      </DialogContent>
    </Dialog>
  );
}
