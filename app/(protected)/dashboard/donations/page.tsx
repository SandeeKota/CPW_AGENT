"use client";
import React, { use, useEffect, useState } from "react";
import { DonationTable } from "@/app/components/dashboard/donation-table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Check, Download, Filter, Search, RefreshCw } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { cn, updateBadges } from "@/lib/utils";
import LoadingScreen from "../../../components/loadingScreen";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { useDonationsHook } from "@/app/lib/storeHooks/useDonations";
import { DonationsLookupModal } from "../../../_types/dination.type";
import { useFundraisers } from "@/app/lib/storeHooks/useFundraisers";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { download80GDonationDetailsXlsx } from "@/app/utils/fileSevice";
import { useAuthStore } from "@/app/stores/authStore";
import Pagination from "@/app/components/pagination";
import { any } from "zod";
import { useProjectsStore } from "@/app/stores/projects.store";
import { ProjectModal } from "@/app/_types/project.types";
import { getFundraiserFilterList } from "@/app/_services/fundraiser.service";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { canAccessDonationsPermission } from "@/app/_types/admin-credential.enum";

const PAGE_LIMIT: number = 20;
type DonationTypeFilter = "all" | "oneTime" | "monthly";
type HasTaxExemptionFilter = "all" | "true" | "false";

export default function DonationsPage() {
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [perLimit, setPerLimit] = useState<number>(PAGE_LIMIT || 20);
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const { publicProjects, fetchPublicProjects, getProjectById } =
    useProjectsStore();
  const {
    donations,
    loading,
    subscriptionStatusLoading,
    fetchDonations,
    totalPages,
    currentPage,
    totalCount,
    error,
    donorsCount,
    totalDonationAmount,
    totalEUR,
    totalUSD,
    totalINR,
    totalGBP,
    fetchDonationsAnalytics,
    analyticsLoading,
    analyticsError,
    analyticsCards,
  } = useDonationsHook();
  const [donationTypeFilter, setDonationTypeFilter] =
    useState<DonationTypeFilter>("all");
  const [hasTaxExemptionFilter, setHasTaxExemptionFilter] =
    useState<HasTaxExemptionFilter>("all");
  const [showClearFilter, setShowClearFilter] = useState<boolean>(false);

  // State for API-driven select
  const [apiOptions, setApiOptions] = useState<any[]>([]);
  const [apiSelectValue, setApiSelectValue] = useState("");
  const [filterByOpen, setFilterByOpen] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [debouncedCampaignSearchQuery, setDebouncedCampaignSearchQuery] =
    useState("");

  const isAdmin = user?.role === "admin" && user?.isAdminMode === true;

  const { credentials } = useAdminCredentials(user?._id);
  const hasPermission = canAccessDonationsPermission(
    isAdmin,
    credentials,
    user?.role,
  );

  const adjustAmounts = () => {
    if (donations && donations?.length > 0) {
      const total = donations?.reduce(
        (acc, dona) =>
          acc +
          (dona?.convertedAmounts?.[selectedCurrency?.toUpperCase() || "INR"] ||
            dona?.amount / 100),
        0,
      );
      setTotalAmount(total);
    }
  };

  useEffect(() => {
    adjustAmounts();
  }, [donations, selectedCurrency]);

  useEffect(() => {
    loadProject();
    updateBadges();
  }, []);

  const loadProject = async () => {
    await fetchPublicProjects();
  };

  useEffect(() => {
    getFundraiserFilterList().then(setApiOptions);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCampaignSearchQuery(campaignSearchQuery.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [campaignSearchQuery]);

  useEffect(() => {
    fetchDonations(
      pageNumber,
      perLimit,
      searchQuery,
      "",
      selectedCurrency?.toUpperCase() || "INR",
      {
        fundraiser_id: apiSelectValue || "",
        donation_type: donationTypeFilter === "all" ? "" : donationTypeFilter,
        has_tax_exemption:
          hasTaxExemptionFilter === "all" ? "" : hasTaxExemptionFilter,
      },
    );
  }, [
    pageNumber,
    perLimit,
    searchQuery,
    apiSelectValue,
    donationTypeFilter,
    hasTaxExemptionFilter,
    selectedCurrency,
  ]);

  useEffect(() => {
    fetchDonationsAnalytics(selectedCurrency?.toUpperCase() || "INR");
  }, []);

  useEffect(() => {
    if (
      searchQuery ||
      donationTypeFilter !== "all" ||
      hasTaxExemptionFilter !== "all" ||
      (apiSelectValue && apiSelectValue !== "")
    ) {
      setShowClearFilter(true);
    } else {
      setShowClearFilter(false);
    }
  }, [searchQuery, donationTypeFilter, hasTaxExemptionFilter, apiSelectValue]);

  const activeFilterCount = [
    apiSelectValue,
    donationTypeFilter !== "all" ? donationTypeFilter : "",
    hasTaxExemptionFilter !== "all" ? hasTaxExemptionFilter : "",
  ].filter(Boolean).length;

  const handleExport = async () => {
    setExportLoading(true);
    try {
      await download80GDonationDetailsXlsx();
    } catch (error: any) {
      console.error("Unable to export 80G donation details", error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearFilter = () => {
    setSearchQuery("");
    setDonationTypeFilter("all");
    setHasTaxExemptionFilter("all");
    setApiSelectValue("");
    setCampaignSearchQuery("");
    setPageNumber(1);
    setShowClearFilter(false);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleRefresh = () => {
    fetchDonations(
      pageNumber,
      perLimit,
      searchQuery,
      "",
      selectedCurrency?.toUpperCase() || "INR",
      {
        fundraiser_id: apiSelectValue || "",
        donation_type: donationTypeFilter === "all" ? "" : donationTypeFilter,
        has_tax_exemption:
          hasTaxExemptionFilter === "all" ? "" : hasTaxExemptionFilter,
      },
    );
  };

  const getCampaignOptionValue = (item: any) =>
    item?._id || item?.id || item?.value || "";

  const getCampaignOptionLabel = (item: any) =>
    item?.name || item?.title || getCampaignOptionValue(item);

  const selectedCampaign = apiOptions.find(
    (item) => getCampaignOptionValue(item) === apiSelectValue,
  );
  const selectedCampaignLabel = selectedCampaign
    ? getCampaignOptionLabel(selectedCampaign)
    : "All campaigns";
  const filteredCampaignOptions = debouncedCampaignSearchQuery
    ? apiOptions.filter((item) =>
        getCampaignOptionLabel(item)
          .toLowerCase()
          .includes(debouncedCampaignSearchQuery),
      )
    : apiOptions;

  return (
    <React.Fragment>
      <div className="flex flex-col h-full max-h-screen overflow-hidden py-4 md:py-6 ">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <button
              disabled
              type="button"
              className="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center"
            >
              <svg
                aria-hidden="true"
                role="status"
                className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="#1C64F2"
                />
              </svg>
              Loading...
            </button>
          </div>
        ) : (
          <React.Fragment>
            <div className="px-4 md:px-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Donations</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw
                      className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
                    />
                    Refresh
                  </Button>
                  {hasPermission && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      disabled={exportLoading}
                    >
                      {exportLoading ? (
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                      ) : (
                        <Download className="mr-2 h-4 w-4" />
                      )}
                      Export 80G XLSX
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Donations Overview</CardTitle>
                  <CardDescription>
                    Manage and track all the donors and their contributions to
                    your fundraisers.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Loading donations overview...</span>
                    </div>
                  ) : analyticsError ? (
                    <p className="text-sm text-red-600">{analyticsError}</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Total Donors
                        </p>
                        <p className="text-3xl font-bold">
                          {analyticsCards?.donorsCount || 0}
                        </p>
                      </div>
                      <div className="space-y-2 flex flex-col gap-2">
                        <div className="w-full flex items-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Donations in INR : &nbsp;
                          </p>
                          <p className="text-sm font-bold">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "INR",
                              maximumFractionDigits: 0,
                            }).format(analyticsCards?.totalByINR || 0)}
                          </p>
                        </div>
                        <div className="w-full flex items-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Donations in USD : &nbsp;
                          </p>
                          <p className="text-sm font-bold">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              maximumFractionDigits: 0,
                            }).format(analyticsCards?.totalByUSD || 0)}
                          </p>
                        </div>
                        <div className="w-full flex items-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Donations in EUR : &nbsp;
                          </p>
                          <p className="text-sm font-bold">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "EUR",
                              maximumFractionDigits: 0,
                            }).format(analyticsCards?.totalByEUR || 0)}
                          </p>
                        </div>
                        <div className="w-full flex items-center">
                          <p className="text-sm font-medium text-muted-foreground">
                            Donations in GBP : &nbsp;
                          </p>
                          <p className="text-sm font-bold">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "GBP",
                              maximumFractionDigits: 0,
                            }).format(analyticsCards?.totalByGBP || 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="flex flex-col gap-4 md:flex-row md:items-center pt-2 mb-6">
                <div className="relative flex-1  mx-2 ">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by campaign name,center name and email"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => {
                      setPageNumber(1);
                      setSearchQuery(e.target.value);
                    }}
                  />
                </div>
                <Popover open={filterByOpen} onOpenChange={setFilterByOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between md:w-[180px]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filter by
                      </span>
                      {activeFilterCount > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-medium text-white">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[calc(100vw-2rem)] max-w-[760px] p-0"
                  >
                    <div className="grid gap-4 p-4 md:grid-cols-[minmax(280px,1fr)_minmax(300px,1fr)]">
                      <div className="space-y-2 rounded-lg border border-slate-200 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Filter by campaign
                        </p>
                        <div className="rounded-md border border-slate-200">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Search campaign..."
                              value={campaignSearchQuery}
                              onValueChange={setCampaignSearchQuery}
                            />
                            <CommandList className="max-h-56">
                              <CommandEmpty>No campaign found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="all campaigns"
                                  onSelect={() => {
                                    setPageNumber(1);
                                    setApiSelectValue("");
                                    setFilterByOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      apiSelectValue
                                        ? "opacity-0"
                                        : "opacity-100",
                                    )}
                                  />
                                  All campaigns
                                </CommandItem>
                                {filteredCampaignOptions.length <= 0 && (
                                  <div className="py-6 text-center text-sm text-muted-foreground">
                                    No campaign found.
                                  </div>
                                )}
                                {filteredCampaignOptions.map((item: any) => {
                                  const value = getCampaignOptionValue(item);
                                  if (!value) return null;
                                  const label = getCampaignOptionLabel(item);
                                  return (
                                    <CommandItem
                                      key={value}
                                      value={`${label} ${value}`}
                                      onSelect={() => {
                                        setPageNumber(1);
                                        setApiSelectValue(value);
                                        setFilterByOpen(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          apiSelectValue === value
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      <span className="truncate">{label}</span>
                                    </CommandItem>
                                  );
                                })}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {selectedCampaignLabel}
                        </p>
                      </div>

                      <div className="space-y-4 rounded-lg border border-slate-200 p-3">
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Donation type
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                donationTypeFilter === "all"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setDonationTypeFilter("all");
                                setFilterByOpen(false);
                              }}
                            >
                              All
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                donationTypeFilter === "oneTime"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setDonationTypeFilter("oneTime");
                                setFilterByOpen(false);
                              }}
                            >
                              One-time
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                donationTypeFilter === "monthly"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setDonationTypeFilter("monthly");
                                setFilterByOpen(false);
                              }}
                            >
                              Recurring
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Tax Exemption
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                hasTaxExemptionFilter === "all"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setHasTaxExemptionFilter("all");
                                setFilterByOpen(false);
                              }}
                            >
                              Any
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                hasTaxExemptionFilter === "true"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setHasTaxExemptionFilter("true");
                                setFilterByOpen(false);
                              }}
                            >
                              Yes
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={
                                hasTaxExemptionFilter === "false"
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                setPageNumber(1);
                                setHasTaxExemptionFilter("false");
                                setFilterByOpen(false);
                              }}
                            >
                              No
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                {showClearFilter && (
                  <Button onClick={() => handleClearFilter()}>
                    Clear Filter
                  </Button>
                )}
              </div>
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
                <div className="flex-1 overflow-y-auto">
                  {!loading && (
                    <DonationTable
                      donations={donations || []}
                      subscriptionStatusLoading={subscriptionStatusLoading}
                      enableTaxCertificateUpload
                      onCertificateUploaded={handleRefresh}
                    />
                  )}
                  {(!donations || donations.length <= 0) && (
                    <p className="text-center my-20">
                      {showClearFilter
                        ? "Donations not found."
                        : "No donations have been made yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="px-4 md:px-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                maxVisiblePages={5}
                onPageChange={handlePageChange}
                totalItems={totalCount || 0}
                limitNum={perLimit || 20}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
