"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import React, { useEffect, useRef, useState } from "react";
import { DonationsLookupModal } from "@/app/_types/dination.type";
import Image from "next/image";
import SendFileIcon from "@/assets/sendfileIcon.png";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import api from "@/app/_services/api_service";
import {
  saveDonationTaxExemptionDetails,
  verifyPanForDonation,
} from "@/app/_services/donation.service";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { useAuthStore } from "@/app/stores/authStore";
import {
  canAccessDonationsPermission,
  canAccessFundraiserPermission,
} from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { isUserIsAdminCheck } from "@/lib/constants";
import { AddToFundraiserDialog } from "./add-to-fundraiser-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import type { PanVerificationResponse } from "@/app/_types/dination.type";

const MAX_80G_CERTIFICATE_SIZE_BYTES = 10 * 1024 * 1024;
const DONATION_TABLE_COLUMN_COUNT = 8;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const INDIAN_POSTAL_CODE_REGEX = /^[1-9][0-9]{5}$/;

type TaxExemptionFormState = {
  name_as_per_pan: string;
  pan: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
};

type PendingCertificateUpload = {
  donation: DonationsLookupModal;
  file: File;
  previewUrl: string;
};

const EMPTY_TAX_EXEMPTION_FORM: TaxExemptionFormState = {
  name_as_per_pan: "",
  pan: "",
  address_line: "",
  city: "",
  state: "",
  country: "India",
  postal_code: "",
};

interface DonationTableProps {
  donations: DonationsLookupModal[];
  from?: "my-donations" | "all-donations";
  subscriptionStatusLoading?: boolean;
  enableTaxCertificateUpload?: boolean;
  onCertificateUploaded?: () => void | Promise<void>;
}

export function DonationTable({
  donations,
  from = "all-donations",
  subscriptionStatusLoading = false,
  enableTaxCertificateUpload = false,
  onCertificateUploaded,
}: DonationTableProps) {
  const [cancelLoadingId, setCancelLoadingId] = useState<string | null>(null);
  const [uploadingCertificateId, setUploadingCertificateId] = useState<
    string | null
  >(null);
  const [certificateUrls, setCertificateUrls] = useState<
    Record<string, string>
  >({});
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, string>
  >({});
  const [openPaymentPopoverId, setOpenPaymentPopoverId] = useState<
    string | null
  >(null);
  const [linkedFundraisers, setLinkedFundraisers] = useState<
    Record<string, string>
  >({});
  const [expandedDonationRows, setExpandedDonationRows] = useState<
    Record<string, boolean>
  >({});
  const [pendingCertificateUpload, setPendingCertificateUpload] =
    useState<PendingCertificateUpload | null>(null);
  const [certificatePreviewOpen, setCertificatePreviewOpen] = useState(false);
  const [certificateConfirmOpen, setCertificateConfirmOpen] = useState(false);
  const [taxDetailsDonation, setTaxDetailsDonation] =
    useState<DonationsLookupModal | null>(null);
  const [taxDetailsForm, setTaxDetailsForm] = useState<TaxExemptionFormState>(
    EMPTY_TAX_EXEMPTION_FORM,
  );
  const [verifyingPan, setVerifyingPan] = useState(false);
  const [savingTaxDetails, setSavingTaxDetails] = useState(false);
  const [verifiedPan, setVerifiedPan] = useState("");
  const [panVerificationResponse, setPanVerificationResponse] =
    useState<PanVerificationResponse | null>(null);
  const [panVerificationMessage, setPanVerificationMessage] = useState("");
  const [panVerificationError, setPanVerificationError] = useState("");
  const certificateInputRefs = useRef<Record<string, HTMLInputElement | null>>(
    {},
  );
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(user);
  const { credentials } = useAdminCredentials(user?._id);
  const hasPermission = canAccessDonationsPermission(
    isAdmin,
    credentials,
    user?.role,
  );
  const canUploadTaxCertificate =
    enableTaxCertificateUpload &&
    from === "all-donations" &&
    isAdmin &&
    hasPermission;
  const tableColumnCount = DONATION_TABLE_COLUMN_COUNT;
  const pendingDonationId = pendingCertificateUpload?.donation?._id || "";
  const pendingDonorName =
    pendingCertificateUpload?.donation?.userDetails?.name || "this donor";
  const normalizedTaxPan = taxDetailsForm.pan.trim().toUpperCase();
  const normalizedTaxNameAsPerPan = taxDetailsForm.name_as_per_pan.trim();
  const isCurrentPanVerified =
    Boolean(panVerificationResponse) && verifiedPan === normalizedTaxPan;
  const verifiedPanFullName =
    panVerificationResponse?.data?.full_name?.trim() || "";
  const canSaveTaxDetails =
    Boolean(taxDetailsDonation?._id) &&
    isCurrentPanVerified &&
    !verifyingPan &&
    !savingTaxDetails;

  useEffect(() => {
    const previewUrl = pendingCertificateUpload?.previewUrl;
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [pendingCertificateUpload?.previewUrl]);

  const formatLocalDate = (dateString?: string) => {
    if (!dateString) return "-";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "-";
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(parsed);
  };

  const formatPaymentDate = (dateString?: string) => {
    if (!dateString) return "-";
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleString();
  };

  const formatInvoiceAmount = (amount?: number, currency?: string) => {
    const numericAmount = Number(amount || 0);
    const safeCurrency = (currency || "USD").toUpperCase();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: safeCurrency,
    }).format((numericAmount || 0) / 100);
  };

  const getInvoiceStatusStyle = (status?: string) => {
    const normalizedStatus = (status || "").toLowerCase();

    if (normalizedStatus === "paid") {
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }

    if (normalizedStatus === "open" || normalizedStatus === "draft") {
      return "bg-amber-100 text-amber-700 border-amber-200";
    }

    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getEffectiveStatus = (donation: DonationsLookupModal) => {
    const subscriptionId = donation?.subscription_id || "";
    if (subscriptionId && statusOverrides[subscriptionId]) {
      return statusOverrides[subscriptionId];
    }
    return donation?.subscription_status;
  };

  const canCancel = (sub: DonationsLookupModal) => {
    const activeStatuses = ["active", "trialing"];
    const status = sub.subscription_status?.toLowerCase();
    return (
      sub.donationType === "monthly" &&
      !!status &&
      activeStatuses.includes(status) &&
      (isAdmin ? hasPermission : true)
    );
  };

  const hasSubscriptionStatus = (sub: DonationsLookupModal) => {
    return !!sub.subscription_status && sub.subscription_status.trim() !== "";
  };

  const getTaxCertificateUrl = (donation: DonationsLookupModal) => {
    const donationId = donation._id || "";
    return (
      (donationId ? certificateUrls[donationId] : "") ||
      donation.certificate80G_recipt ||
      ""
    );
  };

  const getPaymentReceiptPdfUrl = (donation: DonationsLookupModal) => {
    const paymentReceiptUrl = (donation.payment_recipt || "").trim();
    return paymentReceiptUrl.toLowerCase().includes(".pdf")
      ? paymentReceiptUrl
      : "";
  };

  const toggleDonationRow = (rowId: string) => {
    setExpandedDonationRows((current) => ({
      ...current,
      [rowId]: !current[rowId],
    }));
  };

  const shouldIgnoreRowToggle = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest(
        "a, button, input, label, select, textarea, [role='button']",
      ),
    );
  };

  const handleDonationRowClick = (
    event: React.MouseEvent<HTMLTableRowElement>,
    rowId: string,
  ) => {
    if (shouldIgnoreRowToggle(event.target)) return;
    toggleDonationRow(rowId);
  };

  const handleDonationRowKeyDown = (
    event: React.KeyboardEvent<HTMLTableRowElement>,
    rowId: string,
  ) => {
    if (shouldIgnoreRowToggle(event.target)) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleDonationRow(rowId);
  };

  const validateCertificateFile = (file: File) => {
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return "Only PDF files are allowed.";
    }

    if (file.size > MAX_80G_CERTIFICATE_SIZE_BYTES) {
      return "80G certificate must be 10MB or smaller.";
    }

    return "";
  };

  const handleCancelSubscription = async (donation: DonationsLookupModal) => {
    if (!donation?.subscription_id || cancelLoadingId) return;

    try {
      setCancelLoadingId(donation.subscription_id);

      const provider = donation?.paymentDetails?.provider || "stripe";
      const endpoint =
        provider === "razorpay"
          ? "/v1/payments/razorpay/subscriptions/cancel"
          : "/v1/payments/stripe/subscriptions/cancel";

      await api.post(endpoint, {
        subscription_id: donation.subscription_id,
      });

      setStatusOverrides((prev) => ({
        ...prev,
        [donation.subscription_id as string]: "canceled",
      }));
    } catch (error) {
      // Keep row interaction safe even if cancel API fails.
      console.error("Failed to cancel subscription", error);
    } finally {
      setCancelLoadingId(null);
    }
  };

  const handleCertificateFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    donation: DonationsLookupModal,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;

    const donationId = donation._id || "";
    if (!donationId) {
      toast({
        title: "Upload failed",
        description: "Donation ID is missing for this row.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateCertificateFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPendingCertificateUpload({ donation, file, previewUrl });
    setCertificatePreviewOpen(true);
    setCertificateConfirmOpen(false);
  };

  const clearPendingCertificateUpload = () => {
    setCertificatePreviewOpen(false);
    setCertificateConfirmOpen(false);
    setPendingCertificateUpload(null);
  };

  const openTaxDetailsDialog = (donation: DonationsLookupModal) => {
    const taxDetails = donation.tax_exemption_details;
    const address = taxDetails?.address;
    const existingPan = taxDetails?.pan?.trim().toUpperCase() || "";
    const existingVerification = donation.pan_verification_response || null;

    setTaxDetailsDonation(donation);
    setTaxDetailsForm({
      name_as_per_pan: taxDetails?.name_as_per_pan || "",
      pan: existingPan,
      address_line: address?.address_line || "",
      city: address?.city || "",
      state: address?.state || "",
      country: address?.country || "India",
      postal_code: address?.postal_code || "",
    });
    setPanVerificationResponse(existingVerification);
    setVerifiedPan(
      existingPan &&
        existingVerification?.success &&
        existingVerification?.verified !== false
        ? existingPan
        : "",
    );
    setPanVerificationMessage(
      existingVerification?.message ||
        (existingVerification?.data?.full_name
          ? "PAN verified successfully."
          : ""),
    );
    setPanVerificationError("");
  };

  const closeTaxDetailsDialog = () => {
    if (verifyingPan || savingTaxDetails) return;
    setTaxDetailsDonation(null);
    setTaxDetailsForm(EMPTY_TAX_EXEMPTION_FORM);
    setVerifiedPan("");
    setPanVerificationResponse(null);
    setPanVerificationMessage("");
    setPanVerificationError("");
  };

  const updateTaxDetailsField = (
    field: keyof TaxExemptionFormState,
    value: string,
  ) => {
    const nextValue =
      field === "pan"
        ? value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 10)
        : field === "postal_code"
          ? value.replace(/\D/g, "").slice(0, 6)
          : value;

    setTaxDetailsForm((current) => ({
      ...current,
      [field]: nextValue,
    }));

    if (field === "pan" || field === "name_as_per_pan") {
      setVerifiedPan("");
      setPanVerificationResponse(null);
      setPanVerificationMessage("");
      setPanVerificationError("");
    }
  };

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

  const validateTaxDetailsForm = () => {
    if (!taxDetailsDonation?._id) return "Donation ID is missing.";
    if ((taxDetailsDonation.currency || "INR").toUpperCase() !== "INR") {
      return "80G details can only be saved for INR donations.";
    }
    if (normalizedTaxNameAsPerPan.length < 3) {
      return "Name as per PAN is required.";
    }
    if (!PAN_REGEX.test(normalizedTaxPan)) return "Enter a valid PAN.";
    if (!isCurrentPanVerified) return "Verify PAN before saving.";
    if (!taxDetailsForm.address_line.trim()) return "Address is required.";
    if (!taxDetailsForm.city.trim()) return "City is required.";
    if (!taxDetailsForm.state.trim()) return "State is required.";
    if (!taxDetailsForm.country.trim()) return "Country is required.";
    if (!INDIAN_POSTAL_CODE_REGEX.test(taxDetailsForm.postal_code.trim())) {
      return "Enter a valid 6-digit postal code.";
    }
    return "";
  };

  const handleSaveTaxDetails = async () => {
    const validationError = validateTaxDetailsForm();
    if (validationError) {
      toast({
        title: "Unable to save 80G details",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (!taxDetailsDonation?._id || !panVerificationResponse) return;

    try {
      setSavingTaxDetails(true);
      await saveDonationTaxExemptionDetails({
        donationId: taxDetailsDonation._id,
        taxExemptionDetails: {
          name_as_per_pan: normalizedTaxNameAsPerPan,
          pan: normalizedTaxPan,
          address: {
            address_line: taxDetailsForm.address_line.trim(),
            city: taxDetailsForm.city.trim(),
            state: taxDetailsForm.state.trim(),
            country: taxDetailsForm.country.trim(),
            postal_code: taxDetailsForm.postal_code.trim(),
          },
        },
        panVerificationResponse,
      });

      toast({
        title: "80G details saved",
        description: "Verified PAN details were saved to this donation.",
      });
      closeTaxDetailsDialog();
      void onCertificateUploaded?.();
    } catch (error: any) {
      toast({
        title: "Unable to save 80G details",
        description:
          error?.response?.data?.message ||
          "Unable to save the verified PAN details.",
        variant: "destructive",
      });
    } finally {
      setSavingTaxDetails(false);
    }
  };

  const handleSubmitCertificatePreview = () => {
    setCertificatePreviewOpen(false);
    setCertificateConfirmOpen(true);
  };

  const handleConfirmCertificateUpload = async () => {
    if (!pendingCertificateUpload) return;

    const donationId = pendingCertificateUpload.donation._id || "";
    if (!donationId) {
      toast({
        title: "Upload failed",
        description: "Donation ID is missing for this row.",
        variant: "destructive",
      });
      clearPendingCertificateUpload();
      return;
    }

    try {
      setUploadingCertificateId(donationId);
      const formData = new FormData();
      formData.append("certificate", pendingCertificateUpload.file);

      const response = await api.put(
        `/v1/donations/${donationId}/tax-exemption-certificate`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const certificateUrl = response?.data?.data?.certificate80G_recipt || "";

      if (certificateUrl) {
        setCertificateUrls((current) => ({
          ...current,
          [donationId]: certificateUrl,
        }));
      }

      clearPendingCertificateUpload();
      void onCertificateUploaded?.();
    } catch (error: any) {
      setCertificateConfirmOpen(false);
      setCertificatePreviewOpen(true);
      toast({
        title: "Upload failed",
        description:
          error?.response?.data?.message ||
          "Unable to upload the 80G certificate.",
        variant: "destructive",
      });
    } finally {
      setUploadingCertificateId(null);
    }
  };

  return (
    <React.Fragment>
      <Dialog
        open={Boolean(taxDetailsDonation)}
        onOpenChange={(open) => {
          if (!open) closeTaxDetailsDialog();
        }}
      >
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>80G PAN details</DialogTitle>
            <DialogDescription>
              {taxDetailsDonation?.userDetails?.name || "Donation"}{" "}
              {taxDetailsDonation?.userDetails?.email
                ? `(${taxDetailsDonation.userDetails.email})`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tax-name-as-per-pan">Name as per PAN</Label>
              <Input
                id="tax-name-as-per-pan"
                value={taxDetailsForm.name_as_per_pan}
                placeholder="Enter full name"
                disabled={savingTaxDetails}
                onChange={(event) =>
                  updateTaxDetailsField("name_as_per_pan", event.target.value)
                }
                onBlur={(event) =>
                  updateTaxDetailsField("name_as_per_pan", event.target.value)
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tax-pan">PAN</Label>
              <div className="flex gap-2">
                <Input
                  id="tax-pan"
                  value={taxDetailsForm.pan}
                  maxLength={10}
                  className="uppercase"
                  placeholder="ABCDE1234F"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("pan", event.target.value)
                  }
                  onBlur={(event) =>
                    updateTaxDetailsField("pan", event.target.value)
                  }
                />
                <Button
                  type="button"
                  variant={isCurrentPanVerified ? "secondary" : "outline"}
                  className="h-10 shrink-0"
                  disabled={
                    verifyingPan ||
                    savingTaxDetails ||
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
                    "Verify"
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
                (verifiedPanFullName || panVerificationMessage) && (
                  <p className="text-xs font-semibold text-emerald-700">
                    {verifiedPanFullName || panVerificationMessage}
                  </p>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="tax-address">Address</Label>
                <Input
                  id="tax-address"
                  value={taxDetailsForm.address_line}
                  placeholder="House number, street, area"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("address_line", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-city">City</Label>
                <Input
                  id="tax-city"
                  value={taxDetailsForm.city}
                  placeholder="City"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("city", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-state">State</Label>
                <Input
                  id="tax-state"
                  value={taxDetailsForm.state}
                  placeholder="State"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("state", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-country">Country</Label>
                <Input
                  id="tax-country"
                  value={taxDetailsForm.country}
                  placeholder="India"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("country", event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tax-postal-code">Postal code</Label>
                <Input
                  id="tax-postal-code"
                  value={taxDetailsForm.postal_code}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="500001"
                  disabled={savingTaxDetails}
                  onChange={(event) =>
                    updateTaxDetailsField("postal_code", event.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={verifyingPan || savingTaxDetails}
              onClick={closeTaxDetailsDialog}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!canSaveTaxDetails}
              onClick={handleSaveTaxDetails}
            >
              {savingTaxDetails ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </span>
              ) : (
                "Save details"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={certificatePreviewOpen && Boolean(pendingCertificateUpload)}
        onOpenChange={(open) => {
          if (uploadingCertificateId) return;
          setCertificatePreviewOpen(open);
          if (!open && !certificateConfirmOpen) {
            clearPendingCertificateUpload();
          }
        }}
      >
        <DialogContent className="grid h-[100dvh] max-h-[100dvh] w-screen max-w-none grid-rows-[auto_1fr_auto] gap-0 overflow-hidden border-0 p-0 sm:rounded-none">
          <DialogHeader className="border-b border-slate-200 px-6 py-4">
            <DialogTitle>Preview 80G certificate</DialogTitle>
            <DialogDescription>
              Review the selected PDF before uploading it for {pendingDonorName}
              .
            </DialogDescription>
          </DialogHeader>
          {pendingCertificateUpload && (
            <div className="flex min-h-0 flex-col gap-3 bg-slate-100 p-4">
              <div className="flex flex-col gap-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">
                  {pendingCertificateUpload.file.name}
                </span>
                <span>
                  {(pendingCertificateUpload.file.size / (1024 * 1024)).toFixed(
                    2,
                  )}{" "}
                  MB
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-slate-200 bg-white">
                <iframe
                  src={pendingCertificateUpload.previewUrl}
                  title="80G certificate PDF preview"
                  className="h-full w-full"
                />
              </div>
            </div>
          )}
          <DialogFooter className="border-t border-slate-200 bg-white px-6 py-4">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(uploadingCertificateId)}
              onClick={clearPendingCertificateUpload}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={Boolean(uploadingCertificateId)}
              onClick={handleSubmitCertificatePreview}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={certificateConfirmOpen && Boolean(pendingCertificateUpload)}
        onOpenChange={(open) => {
          if (uploadingCertificateId) return;
          setCertificateConfirmOpen(open);
          if (!open && pendingCertificateUpload) {
            setCertificatePreviewOpen(true);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to upload this 80G certificate?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm before uploading. This certificate will be saved to
              the donation record and sent to the donor by email.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(uploadingCertificateId)}>
              Review again
            </AlertDialogCancel>
            <Button
              type="button"
              disabled={Boolean(uploadingCertificateId)}
              onClick={handleConfirmCertificateUpload}
            >
              {uploadingCertificateId === pendingDonationId ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading
                </span>
              ) : (
                "Upload and send email"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_28px_-22px_rgba(2,6,23,0.7)] overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1180px]">
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="w-10 text-center font-semibold text-slate-600">
                  <span className="sr-only">Details</span>
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Name
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Email
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Phone
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Donation Type
                </TableHead>
                <TableHead className="!overflow-hidden !max-w-[200px] font-semibold text-slate-600">
                  Center
                </TableHead>
                <TableHead className="!overflow-hidden !max-w-[200px] font-semibold text-slate-600">
                  Campaign
                </TableHead>
                <TableHead className="font-semibold text-slate-600">
                  Amount
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {donations &&
                donations.length > 0 &&
                donations.map(
                  (donation: DonationsLookupModal, index: number) => {
                    const donationId = donation._id || "";
                    const linkedFundraiserTitle = donationId
                      ? linkedFundraisers[donationId]
                      : "";
                    const fundraiserTitle =
                      donation.fundraiserDetails?.title ||
                      linkedFundraiserTitle;
                    const taxCertificateUrl = getTaxCertificateUrl(donation);
                    const requestedTaxCertificate = Boolean(
                      donation.tax_exemption_certificate_required,
                    );
                    const isInrDonation =
                      (donation.currency || "INR").toUpperCase() === "INR";
                    const taxExemptionPan =
                      donation.tax_exemption_details?.pan
                        ?.trim()
                        .toUpperCase() || "";
                    const taxExemptionNameAsPerPan =
                      donation.tax_exemption_details?.name_as_per_pan?.trim() ||
                      "";
                    const verificationFullName =
                      donation.pan_verification_response?.data?.full_name?.trim() ||
                      "";
                    const taxExemptionFullName =
                      verificationFullName &&
                      verificationFullName.toLowerCase() !==
                        taxExemptionNameAsPerPan.toLowerCase()
                        ? verificationFullName
                        : "";
                    const hasVerifiedPanDetails = Boolean(
                      taxExemptionPan &&
                      donation.pan_verification_response?.success &&
                      donation.pan_verification_response?.verified !== false,
                    );
                    const issue80GLabel = !isInrDonation
                      ? "80G certificate is not available for non-INR payments"
                      : requestedTaxCertificate
                        ? "Donor requested 80G certificate"
                        : "Donor did not request 80G certificate";
                    const canManageTaxDetailsForDonation =
                      canUploadTaxCertificate &&
                      isInrDonation &&
                      Boolean(donationId);
                    const canUploadTaxCertificateForDonation =
                      canUploadTaxCertificate &&
                      requestedTaxCertificate &&
                      isInrDonation &&
                      hasVerifiedPanDetails &&
                      Boolean(donationId);
                    const paymentReceiptUrl = getPaymentReceiptPdfUrl(donation);
                    const paymentReceiptSent = Boolean(paymentReceiptUrl);
                    const rowId =
                      donationId ||
                      donation.subscription_id ||
                      donation.createdAt ||
                      `donation-${index}`;
                    const isRowExpanded = Boolean(expandedDonationRows[rowId]);
                    const centerName =
                      donation.project_Details?.center_type === "village"
                        ? donation.project_Details?.title || donation.project_Details?.address?.villageName ||
                          "Not Available"
                        : donation.project_Details?.title || donation.project_Details?.schoolName ||
                          "Not Available";
                    const amountLabel = new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: donation?.currency?.toUpperCase() || "INR",
                    }).format(
                      donation?.oringinalAmount || donation?.amount / 100 || 0,
                    );

                    return (
                      <React.Fragment key={rowId}>
                        <TableRow
                          tabIndex={0}
                          aria-expanded={isRowExpanded}
                          className="cursor-pointer transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-inset"
                          onClick={(event) =>
                            handleDonationRowClick(event, rowId)
                          }
                          onKeyDown={(event) =>
                            handleDonationRowKeyDown(event, rowId)
                          }
                        >
                          <TableCell className="w-10 text-center">
                            <ChevronDown
                              className={`mx-auto h-4 w-4 text-slate-500 transition-transform ${
                                isRowExpanded ? "rotate-180" : ""
                              }`}
                              aria-hidden="true"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {donation.userDetails?.name || "Not Available"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {donation.userDetails?.email || "Not Available"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {donation.userDetails?.phone || "Not Available"}
                          </TableCell>
                          <TableCell className="capitalize">
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={
                                  donation.donationType === "monthly"
                                    ? "default"
                                    : "secondary"
                                }
                                className={`${(donation?.donationType === "monthly" && !subscriptionStatusLoading && !hasSubscriptionStatus(donation)) || getEffectiveStatus(donation) === "canceled" ? "opacity-60" : ""}`}
                              >
                                {donation.donationType
                                  ? donation.donationType === "monthly"
                                    ? "Recurring"
                                    : "One Time"
                                  : "Not Available"}
                              </Badge>
                              {donation?.donationType === "monthly" &&
                                subscriptionStatusLoading &&
                                donation?.subscription_id && (
                                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 normal-case">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Loading...
                                  </span>
                                )}
                              {donation?.donationType === "monthly" &&
                                !subscriptionStatusLoading &&
                                canCancel({
                                  ...donation,
                                  subscription_status:
                                    getEffectiveStatus(donation),
                                }) && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    disabled={
                                      cancelLoadingId ===
                                      donation?.subscription_id
                                    }
                                    onClick={() =>
                                      handleCancelSubscription(donation)
                                    }
                                  >
                                    {cancelLoadingId ===
                                    donation?.subscription_id ? (
                                      <span className="inline-flex items-center gap-1 normal-case">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Cancelling
                                      </span>
                                    ) : (
                                      "Cancel"
                                    )}
                                  </Button>
                                )}
                              {donation?.donationType === "monthly" &&
                                getEffectiveStatus(donation) === "canceled" && (
                                  <span className="text-xs opacity-50 bg-red-600 px-3 py-0.5 rounded-full font-medium text-white normal-case">
                                    Canceled
                                  </span>
                                )}

                              {donation?.donationType === "monthly" &&
                                Array.isArray(donation?.payment_details) &&
                                donation.payment_details.length > 0 && (
                                  <Popover
                                    open={
                                      openPaymentPopoverId ===
                                      (donation._id ||
                                        donation.subscription_id ||
                                        donation.createdAt)
                                    }
                                    onOpenChange={(open) => {
                                      const rowId =
                                        donation._id ||
                                        donation.subscription_id ||
                                        donation.createdAt;
                                      if (!rowId) return;
                                      setOpenPaymentPopoverId(
                                        open ? rowId : null,
                                      );
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <button
                                        type="button"
                                        onMouseEnter={() =>
                                          setOpenPaymentPopoverId(
                                            donation._id ||
                                              donation.subscription_id ||
                                              donation.createdAt ||
                                              null,
                                          )
                                        }
                                        onMouseLeave={() =>
                                          setOpenPaymentPopoverId((prev) =>
                                            prev ===
                                            (donation._id ||
                                              donation.subscription_id ||
                                              donation.createdAt)
                                              ? null
                                              : prev,
                                          )
                                        }
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900"
                                        aria-label="View payment details"
                                      >
                                        <Clock3 className="h-3.5 w-3.5" />
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-[340px] rounded-xl border-slate-200 bg-white p-2.5"
                                      align="start"
                                      side="top"
                                      sideOffset={8}
                                      collisionPadding={16}
                                      onMouseEnter={() =>
                                        setOpenPaymentPopoverId(
                                          donation._id ||
                                            donation.subscription_id ||
                                            donation.createdAt ||
                                            null,
                                        )
                                      }
                                      onMouseLeave={() =>
                                        setOpenPaymentPopoverId((prev) =>
                                          prev ===
                                          (donation._id ||
                                            donation.subscription_id ||
                                            donation.createdAt)
                                            ? null
                                            : prev,
                                        )
                                      }
                                    >
                                      <div className="mb-2 border-b border-slate-100 pb-2">
                                        <p className="text-xs font-semibold text-slate-800">
                                          Payment Timeline
                                        </p>
                                        <p className="text-[11px] text-slate-500">
                                          Latest invoices from{" "}
                                          <span className="text-blue-500 font-semibold">
                                            {donation?.paymentDetails
                                              ?.provider === "stripe"
                                              ? "Stripe"
                                              : "Razorpay"}
                                          </span>{" "}
                                          for this subscription
                                        </p>
                                      </div>
                                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                                        {[
                                          ...(donation.payment_details ?? []),
                                        ].map((invoice, invoiceIndex) => (
                                          <div
                                            key={`${invoice?.invoice_id || "invoice"}-${invoiceIndex}`}
                                            className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 transition-colors hover:bg-white"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <p className="truncate text-xs font-semibold text-slate-700">
                                                {invoice?.invoice_id ||
                                                  "Invoice"}
                                              </p>
                                              <Badge
                                                variant="secondary"
                                                className={`h-5 border px-2 text-[10px] uppercase tracking-wide ${getInvoiceStatusStyle(invoice?.invoice_status)}`}
                                              >
                                                {invoice?.invoice_status ||
                                                  "unknown"}
                                              </Badge>
                                            </div>
                                            <p className="mt-1 text-sm font-semibold text-slate-800">
                                              {formatInvoiceAmount(
                                                invoice?.amount_paid,
                                                invoice?.currency,
                                              )}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                              Paid at (ISO):{" "}
                                              {formatPaymentDate(
                                                invoice?.paid_at,
                                              )}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3">
                                              {invoice?.hosted_invoice_url && (
                                                <a
                                                  href={
                                                    invoice.hosted_invoice_url
                                                  }
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-[11px] font-medium text-sky-700 transition-colors hover:text-sky-900"
                                                >
                                                  Invoice URL
                                                </a>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                )}
                            </div>
                          </TableCell>
                          <TableCell className="text-left relative truncate !overflow-hidden !max-w-[200px]">
                            {centerName}
                          </TableCell>
                          <TableCell className="text-left truncate !overflow-hidden !max-w-[200px]">
                            <div className="flex min-w-0 items-center gap-2">
                              {fundraiserTitle ? (
                                <span className="truncate">
                                  {fundraiserTitle}
                                </span>
                              ) : (
                                <span className="shrink-0 text-muted-foreground">
                                  Not Available
                                </span>
                              )}
                              {!fundraiserTitle &&
                                donationId &&
                                isAdmin &&
                                credentials &&
                                canAccessFundraiserPermission(
                                  isAdmin,
                                  credentials,
                                  user?.role,
                                ) && (
                                  <AddToFundraiserDialog
                                    donationId={donationId}
                                    triggerLabel="Link"
                                    triggerClassName="h-7 px-2 text-xs"
                                    onSuccess={(fundraiserTitle) => {
                                      setLinkedFundraisers((current) => ({
                                        ...current,
                                        [donationId]: fundraiserTitle,
                                      }));
                                    }}
                                  />
                                )}
                            </div>
                          </TableCell>
                          <TableCell>{amountLabel}</TableCell>
                        </TableRow>
                        {isRowExpanded && (
                          <TableRow className="bg-slate-50/60">
                            <TableCell
                              colSpan={tableColumnCount}
                              className="p-0"
                            >
                              <div className="grid gap-4 px-4 py-4 md:grid-cols-6">
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Date
                                  </p>
                                  <p className="text-sm font-medium text-slate-800">
                                    {formatLocalDate(donation.createdAt)}
                                  </p>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Required 80G
                                  </p>
                                  <div
                                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-700"
                                    title={issue80GLabel}
                                    aria-label={issue80GLabel}
                                  >
                                    {!isInrDonation ? (
                                      <Ban className="h-5 w-5 text-rose-500" />
                                    ) : (
                                      <span
                                        className={`inline-flex h-6 min-w-10 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                                          requestedTaxCertificate
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                      >
                                        {requestedTaxCertificate ? "YES" : "NO"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    80G PAN
                                  </p>
                                  {!isInrDonation ? (
                                    <span className="text-xs text-slate-500">
                                      Not available
                                    </span>
                                  ) : (
                                    <div className="space-y-2">
                                      {hasVerifiedPanDetails ? (
                                        <div className="space-y-1">
                                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Verified
                                          </span>
                                          <p className="text-xs font-semibold text-slate-800">
                                            {taxExemptionPan}
                                          </p>
                                          {taxExemptionNameAsPerPan && (
                                            <p className="line-clamp-2 text-xs font-medium text-slate-700">
                                              {taxExemptionNameAsPerPan}
                                            </p>
                                          )}
                                          {taxExemptionFullName && (
                                            <p className="line-clamp-2 text-xs text-slate-500">
                                              {taxExemptionFullName}
                                            </p>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-xs text-slate-500">
                                          Missing
                                        </span>
                                      )}
                                      {/* {canManageTaxDetailsForDonation && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="h-8 px-2 text-xs"
                                      onClick={() =>
                                        openTaxDetailsDialog(donation)
                                      }
                                    >
                                      {taxExemptionPan ? "Update" : "Add"}
                                    </Button>
                                  )} */}
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    80G Certificate
                                  </p>
                                  <input
                                    ref={(node) => {
                                      if (donationId) {
                                        certificateInputRefs.current[
                                          donationId
                                        ] = node;
                                      }
                                    }}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="hidden"
                                    onChange={(event) =>
                                      handleCertificateFileChange(
                                        event,
                                        donation,
                                      )
                                    }
                                  />
                                  <div className="flex items-center justify-start gap-2">
                                    {taxCertificateUrl ? (
                                      <Button
                                        asChild
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-2 text-xs"
                                      >
                                        <a
                                          href={taxCertificateUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          aria-label="View 80G certificate"
                                        >
                                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                                          View
                                          <ExternalLink className="ml-1.5 h-3 w-3" />
                                        </a>
                                      </Button>
                                    ) : !canUploadTaxCertificate ? (
                                      <span className="text-xs text-slate-500">
                                        Not available
                                      </span>
                                    ) : null}
                                    {!taxCertificateUrl &&
                                      canUploadTaxCertificate &&
                                      !canUploadTaxCertificateForDonation && (
                                        <span className="text-xs text-slate-500">
                                          {requestedTaxCertificate &&
                                          !hasVerifiedPanDetails
                                            ? "Verify PAN first"
                                            : "Not available"}
                                        </span>
                                      )}
                                    {canUploadTaxCertificateForDonation && (
                                      <Button
                                        type="button"
                                        size={taxCertificateUrl ? "icon" : "sm"}
                                        variant={
                                          taxCertificateUrl
                                            ? "ghost"
                                            : "outline"
                                        }
                                        className={
                                          taxCertificateUrl
                                            ? "h-8 w-8"
                                            : "h-8 px-2 text-xs"
                                        }
                                        disabled={
                                          uploadingCertificateId === donationId
                                        }
                                        aria-label={
                                          taxCertificateUrl
                                            ? "Replace 80G certificate"
                                            : "Upload 80G certificate"
                                        }
                                        title={
                                          taxCertificateUrl
                                            ? "Replace 80G certificate"
                                            : "Upload 80G certificate"
                                        }
                                        onClick={() =>
                                          certificateInputRefs.current[
                                            donationId
                                          ]?.click()
                                        }
                                      >
                                        {uploadingCertificateId ===
                                        donationId ? (
                                          <Loader2
                                            className={
                                              taxCertificateUrl
                                                ? "h-3.5 w-3.5 animate-spin"
                                                : "mr-1.5 h-3.5 w-3.5 animate-spin"
                                            }
                                          />
                                        ) : taxCertificateUrl ? (
                                          <RefreshCw className="h-3.5 w-3.5" />
                                        ) : (
                                          <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                                        )}
                                        {!taxCertificateUrl && "Upload"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Payment Receipt Sent
                                  </p>
                                  <div
                                    className="inline-flex items-center justify-center"
                                    title={
                                      paymentReceiptSent
                                        ? "Payment receipt sent"
                                        : "Payment receipt not available"
                                    }
                                    aria-label={
                                      paymentReceiptSent
                                        ? "Payment receipt sent"
                                        : "Payment receipt not available"
                                    }
                                  >
                                    {paymentReceiptSent ? (
                                      <a
                                        href={paymentReceiptUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-full text-xs font-medium text-sky-700 transition-colors hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                                      >
                                        <Image
                                          src={SendFileIcon}
                                          alt="Open payment receipt"
                                          width={28}
                                          height={28}
                                          className="h-7 w-7 object-contain"
                                        />
                                        View receipt
                                      </a>
                                    ) : (
                                      <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                                        <XCircle className="h-5 w-5 text-slate-400" />
                                        Not available
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Digital Certificate
                                  </p>
                                  <div
                                    className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700"
                                    title="Digital certificate sent"
                                    aria-label="Digital certificate sent"
                                  >
                                    <CheckCircle2
                                      size={28}
                                      color="green"
                                      className="mx-auto"
                                    />
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  },
                )}
              {(!donations || donations.length <= 0) && (
                <TableRow>
                  <TableCell
                    colSpan={tableColumnCount}
                    className="text-center py-10 text-slate-500"
                  >
                    No donations found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </React.Fragment>
  );
}
