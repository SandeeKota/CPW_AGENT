import api from "../_services/api_service";
import { DonationsDocs } from "../_types/dination.type";
import { UserSchema } from "../_types/user.type";
import { CURRENCY_VALID } from "../lib/redox/slices/geolocationSlice";

export const stripepayemntHelper = async (
  amount: number,
  donationMeta: DonationsDocs,
  userMeta: UserSchema | any,
  currency: CURRENCY_VALID,
  currentUrl: string,
  successUrl: string,
  errorUrl: string,
) => {
  try {
    if (!donationMeta || !currency || !currentUrl || !successUrl || !errorUrl) {
      throw new Error(
        "!donationMeta || !currentUrl || !currency || !successUrl || !errorUrl",
      );
    }
    const body = {
      amount: amount,
      donationMeta: donationMeta,
      userMeta: userMeta || ({} as any),
      redirect_url: currentUrl || window.location.href,
      currency: currency || "INR",
      successUrl: successUrl,
      errorUrl: errorUrl,
    };
    const response = await api.post(
      `/v1/payments/stripe/checkout-session`,
      body,
    );

    if (response && response?.data) {
      return response?.data;
    }

    return false;
  } catch (error) {
    return false;
  }
};
export const stripeMonthlypayemntHelper = async (
  amount: number,
  donationMeta: DonationsDocs,
  userMeta: UserSchema | any,
  currency: CURRENCY_VALID,
  currentUrl: string,
  successUrl: string,
  errorUrl: string,
) => {
  try {
    if (!donationMeta || !currency || !currentUrl || !successUrl || !errorUrl) {
      throw new Error(
        "!donationMeta || !currentUrl || !currency || !successUrl || !errorUrl",
      );
    }
    const body = {
      amount: amount,
      donationMeta: donationMeta,
      userMeta: userMeta || ({} as any),
      redirect_url: currentUrl || window.location.href,
      currency: currency || "INR",
      successUrl: successUrl,
      errorUrl: errorUrl,
    };
    const response = await api.post(
      `/v1/payments/stripe/monthly-donation`,
      body,
    );

    if (response && response?.data) {
      return response?.data;
    }

    return false;
  } catch (error) {
    return false;
  }
};
