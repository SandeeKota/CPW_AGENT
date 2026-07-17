import React from "react";
import { StatCard } from "./dashboard/stat-card";

import { BarChart2, Users } from "lucide-react";
import { DashboardAnalyticsCards } from "../helpers/analytics.helper";
import { CURRENCY_VALID } from "../lib/redox/slices/geolocationSlice";

interface DashboardCardsProps {
  dashboardCard: DashboardAnalyticsCards | null;
  isAdmin?: boolean;
  currency: CURRENCY_VALID;
}
const DashboardCards: React.FC<DashboardCardsProps> = ({
  dashboardCard = {
    totalActiveFundraisers: 0,
    totalDonors: 0,
    totalActiveProjects: 0,
    totalRaised: 0,
    averageDonations: 0,
  },
  isAdmin,
  currency = "INR",
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <StatCard
        title="Total Raised"
        value={dashboardCard?.totalRaised?.toString() || "0"}
        description="Across all campaigns"
        // icon={DollarSign}
        trend={{ value: 12.5, isPositive: true }}
        path={"/dashboard/donations"}
        currency={currency}
        className="lg:col-span-1"
      />
      {isAdmin && (
        <StatCard
          title="Active Centers"
          value={(dashboardCard?.totalActiveProjects || 0)?.toString() || "0"}
          icon={BarChart2}
          path={"/dashboard/centers"}
          currency={currency}
          className="lg:col-span-1"
        />
      )}
      <StatCard
        title="Active Fundraisers"
        value={(dashboardCard?.totalActiveFundraisers || 0)?.toString() || "0"}
        icon={BarChart2}
        path={"/dashboard/fundraisers"}
        currency={currency}
        className="lg:col-span-1"
      />
      {isAdmin && (
        <StatCard
          title="Total Donors"
          value={(dashboardCard?.totalDonors || 0)?.toString() || "0"}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
          path={"/dashboard/donors"}
          currency={currency}
          className="lg:col-span-1"
        />
      )}
      <StatCard
        title="Average Donation"
        value={
          (dashboardCard?.averageDonations || 0)?.toString() === "Infinity" ||
          (dashboardCard?.averageDonations || 0)?.toString() === "NaN"
            ? 0
            : dashboardCard?.averageDonations || 0
        }
        // icon={TrendingUp}
        trend={{ value: 3.1, isPositive: true }}
        path={"/dashboard/donations"}
        currency={currency}
        className="lg:col-span-1"
      />
    </div>
  );
};

export default DashboardCards;
