export type SnackbarType = "success" | "warning" | "danger" | "failed";
export type SnackbarPosition = "top" | "bottom" | "left" | "right" | "center";

export interface SnackbarOptions {
  type?: SnackbarType;
  position?: SnackbarPosition;
  duration?: number; // in ms
}

export const MinimumaAmount = {
  INR: 10,
  USD: 5,
  EUR: 5,
  GBP: 5,
};

export const MaximumAmount = {
  INR: 500000,
  USD: 1000000,
  EUR: 1000000,
  GBP: 1000000,
};

export type SupportedCurrency = keyof typeof MinimumaAmount;
