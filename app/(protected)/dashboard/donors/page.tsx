"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Avatar, AvatarFallback } from "@/app/components/ui/avatar";
import { CheckCircle2, Download, Search, UserPlus } from "lucide-react";
import LoadingScreen from "@/app/components/loadingScreen";
import { useDonorsDonationsByContactOr } from "@/app/lib/storeHooks/useDonor";
import { DonarDocs } from "@/app/_types/domor.schema";
import { allVerixImagesLink, handleBulkDownload } from "@/app/utils/fileSevice";
import { useToast } from "@/hooks/use-toast";
import {
  DonationsDocs,
  DonationsLookupModal,
} from "@/app/_types/dination.type";
import { useAppSelector } from "@/app/lib/redox/hooks";
import Pagination from "@/app/components/pagination";
import { debounce } from "@/lib/utils";
import { isUserIsAdminCheck } from "@/lib/constants";
import { useAuthStore } from "@/app/stores/authStore";
import { canAccessDonorManagementPermission } from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";

const PAGE_SIZE = 10;
export default function DonarsPage() {
  const isFirstSearchEffect = useRef(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [showFilterButton, setShowFilterButton] = useState<boolean>(false);
  const [donrExportLoading, setdonorExportLoading] = useState<boolean>(false);
  const { selectedCurrency } = useAppSelector(
    (state) => state?.geoLocationSlice,
  );
  const [donorId, setDonorId] = useState<string>("");
  const { toast } = useToast();
  const {
    donors,
    loading,
    getDigitalCertifiates,
    fetchDonors,
    page,
    pageSize,
    total,
    totalPages,
    setPage,
  } = useDonorsDonationsByContactOr({ page: 1, pageSize: PAGE_SIZE || 10 });

  const { user: db_user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(db_user) || false;

  const { credentials } = useAdminCredentials(db_user?._id);

  const canHasPermissionDonorManagement = canAccessDonorManagementPermission(
    isAdmin,
    credentials,
    db_user?.role || "user",
  );

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const handleExport = async () => {
    setExportLoading(true);
    // const links = await allPdfLinksdonations();
    const verixLinks = await allVerixImagesLink();
    // if (links) {
    //   await handleBulkDownload(links as any, ".pdf", "donation_certificates");
    // }
    if (verixLinks) {
      await handleBulkDownload(
        verixLinks as any,
        ".png",
        "digital_certificates",
      );
    }
    setExportLoading(false);
  };

  useEffect(() => {
    // console.log(" donors ==> ", donors);
  }, [donors]);

  useEffect(() => {
    if (donorId && donorId?.trim()?.length > 0) {
      downloadDigigtalCertificates(donorId);
    }
  }, [donorId]);

  const downloadDigigtalCertificates = async (id: string) => {
    setdonorExportLoading(true);
    const response = await getDigitalCertifiates(id);
    if (response && response?.length > 0) {
      await handleBulkDownload(response as any, ".png", "digital_certificates");
    } else {
      toast({
        title: "No digital certificates found",
      });
    }
    setDonorId("");
    setdonorExportLoading(false);
  };

  const handleClearFilter = () => {
    setSearchQuery("");
    setShowFilterButton(false);
  };

  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }

    if (searchQuery?.trim()?.length > 0) {
      setShowFilterButton(true);
    } else {
      setShowFilterButton(false);
    }

    if (page !== 1) {
      setPage(1);
      return;
    }

    debouncedFetchDonors(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    fetchDonors(page, pageSize, searchQuery || "");
  }, [page]);

  // Define debounce outside of useEffect so it's stable
  const debouncedFetchDonors = React.useMemo(
    () =>
      debounce((query: string) => {
        fetchDonors(0, pageSize, query || "");
      }, 1000), // 500ms delay
    [pageSize], // re-create only if pageSize changes
  );

  const totalAmountDonated = (donations: Partial<DonationsDocs[]>) => {
    return (
      donations?.reduce(
        (acc, dona) =>
          acc +
          (dona?.convertedAmounts?.[selectedCurrency || "INR"] ||
            (dona?.amount || 0) / 100),
        0,
      ) || 0
    );
  };

  const handlePageChange = (values: number) => {
    setPage(values);
  };

  const hasDnationsrecipts = (donations: Partial<DonationsDocs[]>) => {
    return donations?.some((don) => don?.donation_recipt)?.valueOf();
  };

  if (!loading && !canHasPermissionDonorManagement) {
    return (
      <div className="flex flex-col overflow-hidden flex-1 py-4 md:py-6 ">
        <div className="flex-1 flex flex-col items-center justify-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-center">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="flex flex-col overflow-hidden flex-1 py-4 md:py-6 ">
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
            <div className="flex items-center justify-between mb-6 px-4 md:px-6 ">
              <h1 className="text-3xl font-bold tracking-tight">Donors</h1>
            </div>

            <div className="mb-4 flex flex-row gap-5 items-center px-4 md:px-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search"
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {showFilterButton && (
                <Button onClick={() => handleClearFilter()}>
                  Clear Filter
                </Button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col px-4 md:px-6 ">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Email
                      </TableHead>
                      <TableHead className="hidden md:table-cell">
                        Phone
                      </TableHead>
                      <TableHead>Total Donated</TableHead>
                      <TableHead className="hidden md:table-cell text-center ">
                        Fundraiser
                      </TableHead>
                      <TableHead className="hidden md:table-cell text-center ">
                        Total Raised
                      </TableHead>
                      <TableHead className="text-center">
                        Payment Receipt Sent
                      </TableHead>
                      <TableHead className="text-center">
                        Digital Certificate
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {donors.map((supporter: DonarDocs, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {supporter?.first_name?.charAt(0) || ""}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {supporter?.last_name + supporter?.first_name ||
                                ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {supporter.email}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {supporter?.phone || ""}
                        </TableCell>
                        <TableCell>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: selectedCurrency || "INR",
                          }).format(
                            totalAmountDonated(supporter?.donations || []) || 0,
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center ">
                          {supporter.totalCampaign || 0}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-center ">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "INR",
                          }).format(
                            supporter.totalRaisedByFundtaiser ||
                              supporter.totalRaisedAmount ||
                              0,
                          )}
                        </TableCell>
                        {/* <TableCell className="hidden md:table-cell text-center ">{supporter.campaigns?.length || 0}</TableCell> */}
                        <TableCell className="text-center  ">
                          <div className="mx-auto w-full flex items-center justify-center">
                            <CheckCircle2
                              size={28}
                              color="green"
                              className="mx-auto"
                              aria-label="Payment receipt sent"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center flex items-center justify-center ">
                          {/* <Button
                            // onClick={() => setDonorId(supporter?._id || "")}
                            variant="ghost"
                            size="icon"
                            className="mx-auto flex flex-row items-center justify-center "
                          > */}
                          {donorId === supporter?._id && donrExportLoading && (
                            <div className="min-w-8 min-h-8 max-w-8 max-h-8 border-4 border-t-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                          )}
                          {hasDnationsrecipts(supporter?.donations || []) && (
                            <CheckCircle2
                              size={28}
                              color="green"
                              className="mx-auto"
                              aria-label="Digital certificate sent"
                            />
                          )}
                          {/* </Button> */}
                        </TableCell>
                        {/* <TableCell className="hidden md:table-cell">{formatDate((supporter?.donations && supporter?.donations[0]) && supporter?.donations[0]?.createdAt)}</TableCell> */}
                        {/* <TableCell>
                  <Badge
                    variant={supporter.status === "active" ? "default" : "secondary"}
                  >
                    {supporter.status}
                  </Badge>
                </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {(!donors || donors.length <= 0) && (
                <p className="text-center py-24">
                  {showFilterButton
                    ? "No donors found."
                    : "No donors profiles yet."}
                </p>
              )}
            </div>

            <div className="px-4 md:px-6">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total || 0}
                limitNum={pageSize || 20}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
