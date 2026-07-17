function convertToSubcurrency(amount: number, factor = 100) {
  return Math.round(amount * factor);
}

export default convertToSubcurrency;

export const coverFormatedCurrency = (amount: number, currency: string) => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 1,
  });
  return formatter.format(amount);
};
