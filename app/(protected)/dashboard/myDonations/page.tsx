"use client";

import React, { useEffect, useState } from "react";
import { DonationTable } from "@/app/components/dashboard/donation-table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronsUpDown,
  Download,
  Search,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/app/components/ui/calendar";
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
import { useMyDonationsHook } from "@/app/lib/storeHooks/useMyDonations";
import { DonationsLookupModal } from "@/app/_types/dination.type";
import {
  getAllFundraiseDonaionsLink,
  getAllMyVerixLinks,
  handleBulkDownload,
} from "@/app/utils/fileSevice";
import { useFundraisers } from "@/app/lib/storeHooks/useFundraisers";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { useAppSelector } from "@/app/lib/redox/hooks";
import Pagination from "@/app/components/pagination";
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

const PAGE_LIMIT: number = 40;

export default function MyDonationsPage() {
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [projectFilter, setProjectFilter] = useState("all");
  const [date, setDate] = useState<Date>();
  const [perLimit, setPerLimit] = useState<number>(20);
  const { publicProjects, fetchPublicProjects, getProjectById } =
    useProjectsStore();
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [showClearFilter, setShowClearFilter] = useState<boolean>(false);
  const {
    donations,
    loading,
    fetchMyDonations,
    error,
    pagination,
    totalDonationAmount,
    totalEUR,
    totalUSD,
    totalINR,
    totalGBP,
    subscriptionStatusLoading,
  } = useMyDonationsHook();

  // State for API-driven select
  const [apiOptions, setApiOptions] = useState<any[]>([]);
  const [apiSelectValue, setApiSelectValue] = useState("");
  const [campaignFilterOpen, setCampaignFilterOpen] = useState(false);
  const [campaignSearchQuery, setCampaignSearchQuery] = useState("");
  const [debouncedCampaignSearchQuery, setDebouncedCampaignSearchQuery] =
    useState("");

  useEffect(() => {
    // If a campaign is selected, pass its id as a separate param
    fetchMyDonations(
      pageNumber,
      perLimit,
      searchQuery,
      date ? new Date(date || "")?.toLocaleDateString() : "",
      selectedCurrency?.toUpperCase() || "INR",
      apiSelectValue || undefined,
    );
  }, [
    pageNumber,
    perLimit,
    searchQuery,
    date,
    selectedCurrency,
    apiSelectValue,
  ]);
  useEffect(() => {
    fetchPublicProjects();
    updateBadges();
  }, []);

  const adjustAmounts = () => {
    if (donations && donations?.length > 0) {
      const total = donations?.reduce(
        (acc, dona) =>
          acc +
          (dona?.convertedAmounts?.[selectedCurrency || "INR"] ||
            dona?.amount / 100),
        0,
      );
      setTotalAmount(total);
    } else {
      setTotalAmount(0);
    }
  };

  useEffect(() => {
    adjustAmounts();
  }, [donations, selectedCurrency]);

  const handleExport = async () => {
    setExportLoading(true);
    // const links = await getAllFundraiseDonaionsLink();
    const verixLinks = await getAllMyVerixLinks();

    // if (links) {
    //     await handleBulkDownload(links as any, ".pdf", "donation_certificates");
    // }
    if (verixLinks && Array.isArray(verixLinks) && verixLinks?.length > 0) {
      await handleBulkDownload(
        verixLinks as any,
        ".png",
        "digital_certificates",
      );
      setExportLoading(false);
    } else {
      setExportLoading(false);
      displaybadgesNotFound();
    }
  };

  const [isbadgesNotFound, setIsBadgesNotFound] = useState<boolean>(false);

  const displaybadgesNotFound = () => {
    setIsBadgesNotFound(true);
    setTimeout(() => {
      setIsBadgesNotFound(false);
    }, 5000);
  };

  useEffect(() => {
    if (
      searchQuery ||
      date ||
      (projectFilter?.trim() !== "" && projectFilter !== "all") ||
      (apiSelectValue && apiSelectValue !== "")
    ) {
      setShowClearFilter(true);
    } else {
      setShowClearFilter(false);
    }
  }, [searchQuery, projectFilter, date, apiSelectValue]);

  useEffect(() => {
    getFundraiserFilterList().then(setApiOptions);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCampaignSearchQuery(campaignSearchQuery.trim().toLowerCase());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [campaignSearchQuery]);

  const handleClearFilter = () => {
    setSearchQuery("");
    setDate(undefined);
    setPageNumber(1);
    setPerLimit(PAGE_LIMIT);
    setProjectFilter("");
    setApiSelectValue("");
    setShowClearFilter(false);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleRefresh = () => {
    fetchMyDonations(
      pageNumber,
      perLimit,
      searchQuery,
      date ? new Date(date || "")?.toLocaleDateString() : "",
      selectedCurrency?.toUpperCase() || "INR",
      apiSelectValue || undefined,
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
    : "Filter by campaign";
  const filteredCampaignOptions = debouncedCampaignSearchQuery
    ? apiOptions.filter((item) =>
        getCampaignOptionLabel(item)
          .toLowerCase()
          .includes(debouncedCampaignSearchQuery),
      )
    : apiOptions;

  return (
    <React.Fragment>
      <div className="flex flex-col h-full max-h-screen overflow-hidden py-4 md:py-6">
        <div className="flex items-center justify-between mb-6 px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight">My Donations</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => handleRefresh()}
              disabled={loading}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", loading && "animate-spin")}
              />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => handleExport()}>
              {exportLoading && (
                <div className="flex mx-2 items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
                </div>
              )}
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        {isbadgesNotFound && (
          <span className="text-red-700 -mt-5 px-6 ml-auto ">
            badges not found.
          </span>
        )}

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
          <div className="flex-1 overflow-y-auto px-4">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Donations Overview</CardTitle>
                <CardDescription>
                  Manage and track all your contributions to different
                  fundraisers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
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
                        }).format(totalINR || 0 || 0)}
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
                        }).format(totalUSD || 0 || 0)}
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
                        }).format(totalEUR || 0 || 0)}
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
                        }).format(totalGBP || 0 || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by campaign name,center name and email"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {showClearFilter && (
                <Button onClick={() => handleClearFilter()}>
                  Clear Filter
                </Button>
              )}
              <Select
                value={projectFilter}
                onValueChange={(value) => {
                  const valueData = value === "all" ? "" : value;
                  setSearchQuery(valueData || "");
                  setProjectFilter(value);
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem
                    className="truncate capitalize"
                    key={"oneTime"}
                    value={"oneTime"}
                  >
                    {"one-time"}
                  </SelectItem>
                  <SelectItem
                    className="truncate capitalize"
                    key={"monthly"}
                    value={"monthly"}
                  >
                    {"monthly"}
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* New Select for API data */}
              {apiOptions && apiOptions?.length > 0 && (
                <Popover
                  open={campaignFilterOpen}
                  onOpenChange={setCampaignFilterOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={campaignFilterOpen}
                      className="w-full justify-between md:w-[220px]"
                    >
                      <span className="truncate">{selectedCampaignLabel}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    className="w-[var(--radix-popover-trigger-width)] p-0"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search campaign..."
                        value={campaignSearchQuery}
                        onValueChange={setCampaignSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No campaign found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all campaigns"
                            onSelect={() => {
                              setApiSelectValue("");
                              setCampaignFilterOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                apiSelectValue ? "opacity-0" : "opacity-100",
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
                                  setApiSelectValue(value);
                                  setCampaignFilterOpen(false);
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
                  </PopoverContent>
                </Popover>
              )}
            </div>
            <div className="">
              {!loading && (
                <DonationTable
                  donations={donations || []}
                  from={"my-donations"}
                  subscriptionStatusLoading={subscriptionStatusLoading}
                />
              )}
              {(!donations || donations.length <= 0) && (
                <p className="text-center my-20">
                  {showClearFilter
                    ? "Donations not found."
                    : "You haven't made a donation yet."}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="w-full px-4 md:px-6 pb-4">
          <Pagination
            currentPage={pagination?.currentPage || 0}
            totalPages={pagination?.totalPages || 0}
            onPageChange={handlePageChange}
            totalItems={pagination?.totalCount || 0}
            limitNum={perLimit || 20}
          />
        </div>
      </div>
    </React.Fragment>
  );
}
