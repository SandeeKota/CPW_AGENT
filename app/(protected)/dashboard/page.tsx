"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DonationTable } from "../../components/dashboard/donation-table";
import DashboardHeaderTabs from "../../components/dashboardHeaderTabs";
import CreateProjectModal from "../../components/dashboard/create-project-dialog";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import DashboardCards from "../../components/dashboardCards";
import { DonationChart } from "../../components/dashboard/donation-chart";
import { ProjectDistribution } from "../../components/dashboard/project-distribution";
import { CampaignCard } from "../../components/dashboard/campaign-card";
import { useAppSelector } from "../../lib/redox/hooks";
import { useDashboardAnalytics } from "../../helpers/analytics.helper";
import { useFundraisers } from "../../lib/storeHooks/useFundraisers";
import { useDonationsHook } from "../../lib/storeHooks/useDonations";
import { DonationsLookupModal } from "../../_types/dination.type";
import { currencyTabs } from "../../utils/currency_coverter";
import LoadingScreen from "../../components/loadingScreen";
import { useAuthStore } from "@/app/stores/authStore";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { isUserIsAdminCheck } from "@/lib/constants";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";
import { canAccessCenterPermission } from "@/app/_types/admin-credential.enum";

const DashboardPage = () => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const isAdmin = isUserIsAdminCheck(user) || false;
  const { credentials } = useAdminCredentials(user?._id);
  const canAddCenter = canAccessCenterPermission(
    isAdmin,
    credentials,
    user?.role || "user",
  );

  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date()?.toISOString(),
  );
  const { fundraisers, fetchFundraisers } = useFundraisers();
  const [fundraisersList, setFundraisersList] = useState<FundraiserSchema[]>(
    [],
  );
  const [topFourDonations, setTopFourDonations] = useState<
    DonationsLookupModal[]
  >([] as DonationsLookupModal[]);
  const { donations, fetchDonations } = useDonationsHook();
  const [currencyTab, setActiveTab] = useState<string>(
    selectedCurrency || "INR",
  );
  const {
    loading,
    cards: dashboardCard,
    fetchAlayticsCards,
  } = useDashboardAnalytics("");

  useEffect(() => {
    const fetchRecords = async () => {
      await fetchFundraisers({});
      if (isAdmin) {
        await fetchDonations(1, 50);
      }
    };
    fetchRecords();
  }, [user?.isAdminMode]);

  useEffect(() => {
    fetchAlayticsCards(currencyTab as string);
  }, [currencyTab]);

  useEffect(() => {
    if (donations && donations.length > 4) {
      const topDonations = donations.slice(0, 4);
      setTopFourDonations(topDonations);
    } else {
      setTopFourDonations(donations || []);
    }
  }, [donations]);

  const onEditeCampaign = (data: any, index: number) => {
    // console.log(data, index);
  };

  const handleTabsActions = async (data: any) => {
    setActiveTab(data?.value as string);
  };

  useEffect(() => {
    setFundraisersList(fundraisers || []);
  }, [fundraisers]);

  const handleDelete = (fundraiser_id: string) => {
    const fundraisersData = fundraisersList.filter(
      (fundraiser) => fundraiser._id !== fundraiser_id,
    );
    setFundraisersList(fundraisersData);
  };

  return (
    <React.Fragment>
      {/* {
        (loading) && <LoadingScreen inside={true} />
      } */}
      <div className="flex-1 flex flex-col overflow-hidden py-4 md:py-6 ">
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
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex flex-col overflow-y-auto overflow-x-hidden flex-1 px-4 md:px-6">
                <div className="flex flex-col lg:flex-row :items-center justify-between mb-6 gap-4 px-4 md:px-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                      Dashboard
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      Track fundraising progress and recent donor activity.
                    </p>
                  </div>
                  <div className="lg:block hidden">
                    <DashboardHeaderTabs
                      tabs={currencyTabs}
                      onSelect={(data: any) => handleTabsActions(data)}
                    />
                  </div>
                  {canAddCenter ? (
                    <CreateProjectModal>
                      <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-5 w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Center
                      </Button>
                    </CreateProjectModal>
                  ) : (
                    <div></div>
                  )}
                </div>

                <div className="lg:hidden flex flex-row justify-center mb-3 w-auto px-4 md:px-6">
                  <DashboardHeaderTabs
                    tabs={currencyTabs}
                    onSelect={(data: any) => handleTabsActions(data)}
                  />
                </div>

                <DashboardCards
                  dashboardCard={dashboardCard || null}
                  isAdmin={isAdmin}
                  currency={"INR"}
                />

                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 mb-8">
                  <div className="col-span-2">
                    <DonationChart
                      graphData={[]}
                      onSelectBar={(date: string) => setSelectedDate(date)}
                    />
                  </div>
                  <div>
                    <ProjectDistribution
                      month={selectedDate || new Date().toISOString()}
                    />
                  </div>
                </div>

                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_12px_35px_-28px_rgba(2,6,23,0.7)]">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-slate-900">
                      Active Fundraisers
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-slate-300 text-slate-700"
                      onClick={() => router.push("/dashboard/fundraisers")}
                    >
                      View All
                    </Button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                    {fundraisersList &&
                      fundraisersList.length > 0 &&
                      fundraisersList
                        .filter((c: any) => !c.status || c.status === "active")
                        .map(
                          (campaign: any, index: number) =>
                            index <= 2 && (
                              <CampaignCard
                                key={campaign._id}
                                campaign={campaign}
                                isAdmin={isAdmin}
                                viewButton={
                                  !isAdmin || campaign?.createdBy === user?._id
                                }
                                onEdit={(data: any) =>
                                  onEditeCampaign(data, index)
                                }
                                onDelete={(id: string) => handleDelete(id)}
                              />
                            ),
                        )}
                    {(!fundraisersList ||
                      fundraisersList.filter(
                        (c: any) => !c.status || c.status === "active",
                      ).length <= 0) && (
                      <div className="col-span-full border border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
                        <p className="text-slate-700 font-medium">
                          No active fundraisers yet.
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          Create your first fundraiser to start collecting
                          support.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-[0_12px_35px_-28px_rgba(2,6,23,0.7)] mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold text-slate-900">
                        Recent Donations
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-full border-slate-300 text-slate-700"
                        onClick={() => router.push("/dashboard/donations")}
                      >
                        View All
                      </Button>
                    </div>
                    <DonationTable donations={topFourDonations || []} />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

export default DashboardPage;
