"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useTheme } from "next-themes";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { useDashboardAnalytics } from "@/app/helpers/analytics.helper";
import { useEffect } from "react";
import { useAuthStore } from "@/app/stores/authStore";
interface DonationChartProps {
  graphData: any[];
  onSelectBar?: (date: string) => void;
}

export function DonationChart({ graphData, onSelectBar }: DonationChartProps) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const isAdmin = user ? (user?.role === "admin" ? true : false) : false;
  const isDark = theme === "dark";
  const { fetchMonthlyDonations, monthlyDonations } = useDashboardAnalytics("");

  useEffect(() => {
    fetchMonthlyDonations((selectedCurrency as string) || "INR");
  }, [selectedCurrency]);

  const onSelectBarItem = (data: any) => {
    if (isAdmin && data && data?.payload && data?.payload?.date) {
      const dateString = data?.payload?.date;
      const newDate = new Date(dateString).toISOString();
      onSelectBar && onSelectBar(newDate);
    }
  };

  const getFormattedValue = (value: string | number) => {
    // Ensure value is a number
    const numericValue = typeof value === "string" ? parseFloat(value) : value;

    // Format the number
    const formattedRaised = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: selectedCurrency,
      maximumFractionDigits: 0,
    }).format(numericValue || 0); // Default to 0 if numericValue is NaN

    return formattedRaised;
  };

  const formatYAxis = (value: number) => {
    return getFormattedValue(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <p className="font-medium text-slate-800">{label}</p>
          <p className="text-sm text-slate-600">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: selectedCurrency || "INR",
              maximumFractionDigits: 0,
            }).format(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full">
      <Card className="h-full border-slate-200 shadow-[0_12px_32px_-28px_rgba(2,6,23,0.7)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-[18px] font-semibold text-slate-900">
            Monthly Donations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px]">
            {monthlyDonations && monthlyDonations?.length > 0 && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyDonations || []}
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
                      isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
                    }
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: isDark ? "#e1e1e1" : "#333" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1_000_000)
                        return `${(value / 1_000_000).toFixed(1)}M`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value;
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="amount"
                    name="Donation Amount"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    onClick={onSelectBarItem}
                    cursor={isAdmin ? "pointer" : "default"}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {(!monthlyDonations || monthlyDonations?.length <= 0) && (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-slate-500">No data yet.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
