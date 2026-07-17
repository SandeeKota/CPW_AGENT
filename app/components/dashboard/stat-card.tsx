import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useAppSelector } from "@/app/lib/redox/hooks";
import { CURRENCY_VALID } from "@/app/lib/redox/slices/geolocationSlice";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { z } from "zod";

const StatcardPathEnum = z.enum([
  "/dashboard",
  "/dashboard/centers",
  "/dashboard/fundraisers",
  "/dashboard/donations",
  "/dashboard/myDonations",
  "/dashboard/myBadges",
  "/dashboard/donors",
  "/dashboard/analytics",
  "/dashboard/settings",
  "/dashboard/system",
]);
export type StatcardPathEnumSchema = z.infer<typeof StatcardPathEnum>;
export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: any;
  className?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  path: StatcardPathEnumSchema;
  currency: CURRENCY_VALID;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  trend,
  path,
  currency = "INR",
}: StatCardProps) {
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );

  const getFormattedValue = () => {
    if (title === "Total Raised" || title === "Average Donation") {
      // Ensure value is a number
      const numericValue =
        typeof value === "string" ? parseFloat(value) : value;

      // Format the number
      const formattedRaised = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: selectedCurrency,
        maximumFractionDigits: 0,
      }).format(numericValue || 0); // Default to 0 if numericValue is NaN

      return formattedRaised;
    }
    return value;
  };

  return (
    <Link href={path}>
      <Card
        className={cn(
          "overflow-hidden min-h-[136px] cursor-pointer border-slate-200/80 bg-white/90 shadow-[0_10px_35px_-25px_rgba(2,6,23,0.6)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_40px_-24px_rgba(2,6,23,0.65)]",
          className,
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-[13px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold tracking-tight text-slate-900">
            {title === "Total Raised" || title === "Average Donation"
              ? getFormattedValue()
              : value}
          </div>
          {description && (
            <p className="text-xs text-slate-500 mt-1.5">{description}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
