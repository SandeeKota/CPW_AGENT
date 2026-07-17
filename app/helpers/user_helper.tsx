import api from "../_services/api_service";
import { UserSchema } from "../_types/user.type";

export const createUserAndGet = async (user: Partial<UserSchema>) => {
  try {
    const response = await api.post("/v1/user", user);
    if (!response?.data?.user) {
      return null;
    }
    return response.data.user;
  } catch (error: any) {
    return null;
  }
};
export const updateUser = async (user: Partial<UserSchema>) => {
  try {
    const response = await api.put(`/v1/users/${user?._id?.toString()}`, user);
    console.log("response", response);

    if (response?.data?.success) {
      return response?.data?.success;
    }
    return null;
  } catch (error: any) {
    return null;
  }
};
export const toggleUserToAdmin = async (user: Partial<UserSchema>) => {
  try {
    const response = await api.put(
      `/v1/users/toggle/${user?._id?.toString()}`,
      user,
    );
    console.log("response", response);

    if (response?.data?.success) {
      return response?.data?.success;
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

export const deleteUser = async (id: string) => {
  try {
    const response = await api.delete(`/v1/users/${id}`);
    if (response?.data?.success) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

export const getUserById = async (id: string): Promise<UserSchema | null> => {
  try {
    const response = await api.get(`/v1/users/${id}`);
    if (response && response?.data && response?.data?.data) {
      return response.data.data;
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

/**
 * Convert a payment amount to a Stripe compatible amount.
 * For most currencies, Stripe expects the amount in cents.
 * For currencies with zero fractional units (like JPY, KRW) the amount is expected as is.
 * @param amount The amount to convert.
 * @param currency The currency of the amount.
 * @returns The Stripe compatible amount.
 */
const ToPaymentAmount = (amount: number, currency: string) => {
  // For most currencies like INR, USD, EUR — multiply by 100
  const zeroDecimalCurrencies = ["jpy", "krw"]; // Add more if needed

  if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
    return Math.round(amount); // No fractional units
  }

  return Math.round(amount * 100);
};
