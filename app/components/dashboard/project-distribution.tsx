"use client";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ChevronsUpDown } from "lucide-react";
import Image from "next/image";
import {
  useDashboardAnalytics,
  type ProjectDitributions,
} from "@/app/helpers/analytics.helper";
import { getLast12Months } from "@/lib/constants";
import { coverFormatedCurrency } from "@/app/utils/currency_coverter";

interface CampaignDistributionProps {
  month?: string;
}

export function ProjectDistribution({
  month = new Date().toISOString(),
}: CampaignDistributionProps) {
  const [monthsList, setMonthsList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const { loading, distributions, fetchProjectDitributions } =
    useDashboardAnalytics("");

  const totalDonation = useMemo(() => {
    if (!distributions || distributions.length === 0) return 0;
    return distributions.reduce(
      (acc, item) => acc + Number(item.raised || 0),
      0,
    );
  }, [distributions]);

  // useEffect(() => {

  // }, []);

  useEffect(() => {
    // const date = month ? month : new Date().toISOString();
    fetchDistributions(month);
  }, [month]);

  const fetchDistributions = async (date: string) => {
    const datestring = date
      ? new Date(date).toISOString()
      : new Date().toISOString();
    await fetchProjectDitributions(datestring);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    let dateString = new Date(date).toISOString();
    fetchDistributions(dateString);
  };

  useEffect(() => {
    const displayLast12Months = async () => {
      const months: any = await getLast12Months();
      setMonthsList(months as any[]);
      setSelectedDate(months[0].date || "");
    };
    displayLast12Months();
  }, []);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <p className="text-sm font-medium text-slate-800">
            {payload[0].name}
          </p>
          <p className="text-xs text-slate-600">
            {`donation: `}
            <span className="font-bold">
              {coverFormatedCurrency(
                payload[0].payload.raised || 0,
                payload[0].payload.currency_type || "INR",
              )}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <ul className="h-20 overflow-auto gap-1 flex flex-row flex-wrap items-center justify-center list-none p-0 m-0">
        {payload.map((entry: any, index: number) => (
          <li key={`item-${index}`} className="flex items-center mr-4 mb-1">
            <button
              onClick={() => {
                // const selected = distributions.find((item) => item.name === entry.value);
                // setSelectedProject((prev) =>
                //   prev?.name === selected?.name ? null : selected || null
                // );
              }}
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: entry.payload.color }}
            />
            <span className="text-sm text-slate-600">{entry.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="border-slate-200 shadow-[0_12px_32px_-28px_rgba(2,6,23,0.7)]">
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-row gap-1 items-center justify-between flex-wrap">
          <p className="text-base text-slate-900">
            Center Distribution{" "}
            <span className="text-sm text-slate-500">
              (
              {coverFormatedCurrency(
                Number(totalDonation || 0),
                distributions?.[0]?.currency_type || "INR",
              )}
              )
            </span>
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="border w-[150px] border-slate-200 bg-white rounded-md p-2 cursor-pointer mt-[10px]"
            >
              <div className="flex flex-row gap-2 items-center ">
                <p className=" text-sm text-muted-foreground truncate flex-1 ">
                  {selectedDate?.trim() ? selectedDate : "Select month"}
                </p>
                <ChevronsUpDown size={15} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="h-64 overflow-auto border-slate-200">
              {monthsList &&
                monthsList.map((month, index) => (
                  <DropdownMenuItem
                    onClick={() => handleDateChange(month?.date || "")}
                    key={index}
                  >
                    {month?.date || ""}
                  </DropdownMenuItem>
                ))}
              {!monthsList && (
                <DropdownMenuItem>Months not found</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] relative overflow-hidden ">
          {loading && (
            <div className=" w-full h-full justify-center items-center flex flex-col ">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2  ">
                {/* Spinning Loader */}
                <Image
                  src={require("@/assets/pyramid-19501_256.gif")}
                  alt="Loading..."
                  width={200}
                  height={200}
                  className="w-40 h-40 object-cover "
                  loading="eager"
                />
              </div>
            </div>
          )}
          {!loading && distributions && distributions.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributions}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={20}
                  outerRadius={80}
                >
                  {distributions.map((entry, index) => {
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        strokeWidth={1}
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {!loading && (!distributions || distributions.length === 0) && (
            <div className="w-full h-full overflow-hidden flex flex-col items-center justify-center">
              <p className="text-slate-500">No data yet.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
