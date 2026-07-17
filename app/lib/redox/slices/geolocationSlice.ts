import { GeoIPInfo } from "@/app/_types/geolocation.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type CURRENCY_VALID = "INR" | "USD" | "EUR" | "GBP" | string;
export const CURRENCY_SYMOBOLS: CURRENCY_VALID[] = ["INR", "USD", "EUR", "GBP"];

export const defaultDonationAmounts: Record<CURRENCY_VALID, number[]> = {
  INR: [100, 250, 500, 1000, 2500],
  USD: [5, 10, 20, 50, 100],
  EUR: [5, 10, 25, 50, 100],
  GBP: [5, 10, 25, 50, 100],
};

export const currencySymbols: Record<CURRENCY_VALID, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export const getCurrencySymbol = (currency: CURRENCY_VALID): string => {
  return currencySymbols[currency as keyof typeof currencySymbols] || currency;
};

interface locationState {
  location: GeoIPInfo;
  selectedCountry: string;
  selectedCurrency: CURRENCY_VALID;
}

const initialState: locationState = {
  location: {} as GeoIPInfo,
  selectedCountry: "India",
  selectedCurrency: "INR",
};
const geolocationSlice = createSlice({
  name: "geolocation",
  initialState,
  reducers: {
    setGeolocation: (state, action: PayloadAction<GeoIPInfo>) => {
      ((state.location = action.payload),
        (state.selectedCountry = action.payload.country_name || "India"),
        (state.selectedCurrency = action.payload.currency || "INR"),
        localStorage.setItem("currency", action.payload.currency || "INR"));
      localStorage.setItem(
        "country_name",
        action.payload.country_name || "India",
      );
    },
    setSelectedCountry: (state, action: PayloadAction<string>) => {
      const payload_country =
        action.payload === "Overview" ? "India" : action.payload;
      if (payload_country?.trim()) {
        state.selectedCountry = action.payload || "India";
        localStorage.setItem("country_name", action.payload || "India");
      } else {
        state.selectedCountry = "India";
      }
    },
    selectedCurrency: (
      state,
      action: PayloadAction<CURRENCY_VALID | string>,
    ) => {
      const payload_currency = action.payload;
      if (payload_currency?.trim()?.length > 0) {
        state.selectedCurrency = action.payload?.toUpperCase() || "INR";
        localStorage.setItem("currency", action.payload || "INR");
      } else {
        state.selectedCountry = action.payload || "INR";
        localStorage.setItem("currency", action.payload || "INR");
      }
    },
  },
});

export const geolocationActions = geolocationSlice.actions;
export const { setGeolocation, setSelectedCountry } = geolocationSlice.actions;
export default geolocationSlice;
