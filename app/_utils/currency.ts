/**
 * Global Currency Utilities
 */

export function getCurrencySymbol(code?: string): string {
  if (!code) return "₹";
  const upper = code.toUpperCase();
  switch (upper) {
    case "USD": return "$";
    case "INR": return "₹";
    case "GBP": return "£";
    case "EUR": return "€";
    case "CAD": return "C$";
    case "AUD": return "A$";
    default: return upper;
  }
}

export function formatCurrency(amount: number, code?: string): string {
  const symbol = getCurrencySymbol(code);
  const formatted = amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return `${symbol}${formatted}`;
}
