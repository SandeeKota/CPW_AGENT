"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (month: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {months.map((month) => (
        <button
          key={month}
          onClick={() => onChange(month)}
          className={cn(
            "border rounded-md py-2 text-center hover:bg-primary/10",
            value === month && "bg-primary text-white",
          )}
        >
          {month}
        </button>
      ))}
    </div>
  );
}
