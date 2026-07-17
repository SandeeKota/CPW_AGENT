"use client";
import React, { useEffect, useRef } from "react";

type Props = {
  fromYear?: number;
  toYear?: number;
  onSelect: (year: number) => void;
  onClose?: () => void;
};

export function YearOnlyPicker({
  fromYear = 1990,
  toYear = new Date().getFullYear(),
  onSelect,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const years = Array.from(
    { length: toYear - fromYear + 1 },
    (_, i) => fromYear + i,
  ).reverse();

  // Detect outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose?.();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={containerRef} className="grid grid-cols-4 gap-3 p-4 bg-white">
      {years.map((year) => (
        <button
          type="button"
          key={year}
          onClick={() => onSelect(year)}
          className="px-3 py-2 border rounded hover:bg-blue-100 text-sm"
        >
          {year}
        </button>
      ))}
    </div>
  );
}
