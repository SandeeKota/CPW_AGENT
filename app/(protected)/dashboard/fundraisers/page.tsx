"use client";

import React, { useEffect, useState } from "react";
import { CampaignCard } from "@/app/components/dashboard/campaign-card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Plus, Search } from "lucide-react";
import LoadingScreen from "@/app/components/loadingScreen";
import { useFundraisers } from "@/app/lib/storeHooks/useFundraisers";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/stores/authStore";
import Pagination from "@/app/components/pagination";
import { isUserIsAdminCheck } from "@/lib/constants";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { canAccessFundraiserPermission } from "@/app/_types/admin-credential.enum";

const PAGE_LIMIT: number = 10;
export default function CampaignsPage() {
  const router = useRouter();
  const [showClearFilter, setShowClearFilter] = useState<boolean>(false);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [fundraisersList, setFundraisersList] = useState<FundraiserSchema[]>(
    [],
  );
  const [perLimit, setPerLimit] = useState<number>(PAGE_LIMIT || 10);
  const {
    fundraisers,
    fetchFundraisers,
    pageCurrent,
    totalPages,
    total,
    loading,
  } = useFundraisers();

  const { user: db_user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(db_user) || false;

  const { credentials } = useAdminCredentials(db_user?._id);
  const canAddCampaign = canAccessFundraiserPermission(
    isAdmin,
    credentials,
    db_user?.role || "user",
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchFundraisers({
      page: pageNumber,
      limit: perLimit,
      status: statusFilter || "",
      search: searchQuery.trim(),
    });
  }, [pageNumber, perLimit, statusFilter, searchQuery]);

  const handleClearFilter = () => {
    setPageNumber(1);
    setPerLimit(PAGE_LIMIT);
    setStatusFilter("");
    setSearchQuery("");
  };

  const onSearch = (text: string) => {
    setPageNumber(1);
    setSearchQuery(text);
  };

  useEffect(() => {
    if (
      searchQuery?.trim() !== "" ||
      (statusFilter?.trim() !== "" && statusFilter !== "all")
    ) {
      setShowClearFilter(true);
    } else {
      setShowClearFilter(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    setFundraisersList(fundraisers);
  }, [fundraisers]);

  const handleDelete = (fundraiser_id: string) => {
    const fundraisersData = fundraisersList.filter(
      (fundraiser) => fundraiser._id !== fundraiser_id,
    );
    setFundraisersList(fundraisersData);
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  return (
    <React.Fragment>
      <div className="flex-1 overflow-hidden flex flex-col py-4 md:py-6">
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
            <div className="w-full px-4 md:px-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight">
                  Fundraisers
                </h1>
                {(!isAdmin || canAddCampaign) && (
                  <Button
                    onClick={() => router.push("/dashboard/create-fundraise")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Fundraiser
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto px-4 md:px-6 ">
              <div className="flex flex-col gap-4 md:flex-row md:items-center mb-6 mt-2 mx-2">
                <div className="relative flex-1 ">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 transform h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                  />
                </div>
                {showClearFilter && (
                  <Button onClick={() => handleClearFilter()}>
                    Clear Filter
                  </Button>
                )}
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(value) => {
                    setPageNumber(1);
                    setStatusFilter(value === "all" ? "" : value || "");
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fundraisersList.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {fundraisersList.map((campaign: FundraiserSchema) => (
                    <CampaignCard
                      key={campaign._id}
                      campaign={campaign}
                      isAdmin={isAdmin}
                      viewButton={
                        (canAddCampaign && canAddCampaign) ||
                        campaign?.createdBy === db_user?._id
                      }
                      onDelete={(id) => handleDelete(id || "")}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-lg text-muted-foreground">
                    {showClearFilter ? (
                      "Fundraisers not found."
                    ) : (
                      <span>
                        {isAdmin
                          ? "No fundraisers have been created yet."
                          : "You haven’t created a fundraiser yet."}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="w-full px-4 md:px-6">
              <Pagination
                currentPage={pageCurrent}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={total || 0}
                limitNum={perLimit || PAGE_LIMIT}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
