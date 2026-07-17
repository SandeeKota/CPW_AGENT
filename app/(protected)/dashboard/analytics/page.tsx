"use client";

import { DonationChart } from "@/app/components/dashboard/donation-chart";
import { ProjectDistribution } from "@/app/components/dashboard/project-distribution";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import LoadingScreen from "@/app/components/loadingScreen";
import { useDashboardAnalytics } from "@/app/helpers/analytics.helper";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { UserSchema } from "@/app/_types/user.type";
import { RootState } from "@/app/lib/redox/store";
import { useAuthStore } from "@/app/stores/authStore";
import DashboardHeaderTabs from "@/app/components/dashboardHeaderTabs";
import { currencyTabs } from "@/app/utils/currency_coverter";
export default function AnalyticsPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date()?.toISOString(),
  );
  const { user } = useAuthStore();
  const isAdmin =
    (user?.role === "admin" || user?.role === "super_admin") &&
    user?.isAdminMode;
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );

  const {
    loading,
    error,
    distributions,
    fetchProjectDitributions,
    monthlyDonors,
    fetchMonthlyDonors,
  } = useDashboardAnalytics("");

  useEffect(() => {
    const fetchRecords = async () => {
      await fetchMonthlyDonors();
    };

    fetchRecords();
  }, [user?.isAdminMode, selectedCurrency]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm">
              {entry.name}: {entry.value}
              {entry.name === "Conversion Rate" ? "%" : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleTabsActions = async (data: any) => {
    // await fetchAlayticsCards(data?.value as string);
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
            <div className="w-full flex flex-row items-center justify-center px-4 md:px-6">
              <DashboardHeaderTabs
                tabs={currencyTabs}
                onSelect={(data: any) => handleTabsActions(data)}
              />
            </div>

            <div className="mb-6 px-4 md:px-6">
              <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
              <p className="text-muted-foreground">
                Track and analyze your fundraising performance
              </p>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 md:px-6">
              <Tabs defaultValue="overview" className="mb-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="donations">Donations</TabsTrigger>
                  <TabsTrigger value="donors">Donors</TabsTrigger>
                  <TabsTrigger value="campaigns">Fundraisers</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <DonationChart
                      graphData={[]}
                      onSelectBar={(date: string) =>
                        setSelectedDate(
                          new Date(date)?.toISOString().slice(0, 7),
                        )
                      }
                    />
                    <ProjectDistribution
                      month={
                        selectedDate || new Date().toISOString().slice(0, 7)
                      }
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Donor Growth</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {monthlyDonors && monthlyDonors?.length > 0 && (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={monthlyDonors || []}
                              margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={
                                  isDark
                                    ? "rgba(255, 255, 255, 0.1)"
                                    : "rgba(0, 0, 0, 0.1)"
                                }
                              />
                              <XAxis
                                dataKey="month"
                                tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                              />
                              <YAxis
                                tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                              />
                              <Tooltip content={<CustomTooltip />} />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="donors"
                                dot={{ r: 3 }} // Add this line
                                name="Total Donors"
                                stroke="hsl(var(--chart-2))"
                                activeDot={{ r: 8 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        )}
                        {(!monthlyDonors || monthlyDonors?.length <= 0) && (
                          <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center">
                            <p>No data yet.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="donations" className="space-y-6 mt-6">
                  <DonationChart
                    graphData={[]}
                    onSelectBar={(date: string) => setSelectedDate(date)}
                  />
                </TabsContent>

                <TabsContent value="donors" className="space-y-6 mt-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Donor Growth</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px]">
                          {monthlyDonors && monthlyDonors?.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={monthlyDonors || []}
                                margin={{
                                  top: 5,
                                  right: 30,
                                  left: 20,
                                  bottom: 5,
                                }}
                              >
                                <CartesianGrid
                                  strokeDasharray="3 3"
                                  stroke={
                                    isDark
                                      ? "rgba(255, 255, 255, 0.1)"
                                      : "rgba(0, 0, 0, 0.1)"
                                  }
                                />
                                <XAxis
                                  dataKey="month"
                                  tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                                />
                                <YAxis
                                  tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey="donors"
                                  dot={{ r: 3 }} // Add this line
                                  name="Total Donors"
                                  stroke="hsl(var(--chart-2))"
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          )}

                          {(!monthlyDonors || monthlyDonors?.length <= 0) && (
                            <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center">
                              <p>No data yet.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-6 mt-6">
                  <ProjectDistribution month={new Date().toISOString()} />
                </TabsContent>
              </Tabs>
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
}
