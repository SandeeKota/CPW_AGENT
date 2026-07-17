import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  CURRENCY_VALID,
  geolocationActions,
} from "../lib/redox/slices/geolocationSlice";
import { useAppDispatch, useAppSelector } from "../lib/redox/hooks";
import { CurrencyTab } from "../utils/currency_coverter";

interface Props {
  tabs: CurrencyTab[];
  onSelect: (selectedData: any) => void;
}
const DashboardHeaderTabs: React.FC<Props> = ({ tabs, onSelect }) => {
  const dispatch = useAppDispatch();
  const { selectedCurrency } = useAppSelector(
    (state) => state.geoLocationSlice,
  );
  const [currencyTab, setActiveTab] = useState<string>(
    selectedCurrency || "INR",
  );

  const handleSelectTab = (selectedButton: CurrencyTab) => {
    setActiveTab(selectedButton?.value);
    dispatch(
      geolocationActions.selectedCurrency(
        selectedButton.value as CURRENCY_VALID,
      ),
    );
    onSelect(selectedButton);
  };

  useEffect(() => {
    if (selectedCurrency) {
      setActiveTab(selectedCurrency?.toUpperCase());
    }
  }, [selectedCurrency]);
  return (
    <div className="flex flex-row  flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab, index: number) => (
        <Button
          className={`rounded-full px-4 min-h-[34px] ${tab.value === currencyTab ? "!bg-slate-900 !text-white shadow-sm" : "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"} `}
          onClick={() => handleSelectTab(tab as any)}
          key={index}
        >
          {tab.value}
        </Button>
      ))}
    </div>
  );
};

export default DashboardHeaderTabs;
