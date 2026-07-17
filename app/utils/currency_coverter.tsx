import { CURRENCY_VALID } from "../lib/redox/slices/geolocationSlice";
import IndiaFlag from "@/assets/india.svg";
import UsFlag from "@/assets/us.svg";
import EuropeFlag from "@/assets/urope.svg";

export const CURRENCY_TABS: CURRENCY_VALID[] = ["INR", "USD", "EUR", "GBP"];

export interface CurrencyTab {
  label: string;
  value: CURRENCY_VALID;
  image: string;
}
export const currencyAmounts = {
  INR: [500, 1000, 2500, 3000],
  USD: [10, 25, 50, 100],
  EUR: [8, 20, 40, 80],
  GBP: [8, 20, 40, 80],
};

export type CurrencyCode = keyof typeof currencyAmounts; // "INR" | "USD" | "EUR" | "GBP"
export type CurrencyAmounts = (typeof currencyAmounts)[CurrencyCode][number]; // individual number like 500
export const currencyTabs: CurrencyTab[] = [
  { label: "INR - Indian Rupee", value: "INR", image: IndiaFlag.src },
  { label: "USD - US Dollar", value: "USD", image: UsFlag.src },
  { label: "EUR", value: "EUR", image: EuropeFlag.src },
  { label: "GBP - British Pound", value: "GBP", image: EuropeFlag.src },
];

export const coverFormatedCurrency = (
  amount: number,
  currency: CURRENCY_VALID,
) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  });
  return formatter.format(amount);
};
