import api from "@/app/_services/api_service";
import { DonationsDocs } from "@/app/_types/dination.type";
import config from "@/app/config/config";
import axios from "axios";

export const loadRazorpay = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// amount, donationMeta, userMeta, currency, redirect_url
export const handleRazorepayPayment = async ({
  amount,
  donationMeta,
  userMeta,
  currency,
  redirect_url,
}: {
  amount: number;
  donationMeta: DonationsDocs;
  userMeta: any;
  currency: "INR";
  redirect_url: string;
}) => {
  if (!amount || !donationMeta || !userMeta || !currency || !redirect_url) {
    return null;
  }

  let donationObj: DonationsDocs = donationMeta;
  donationObj.createdAt = new Date().toDateString();

  const body = {
    amount,
    donationMeta: donationObj,
    userMeta,
    currency,
    redirect_url,
  };

  // const { data } = await axios.post("https://alpha-be.friendsofwater.org/v1/razorepay/create-payment-order", body);

  const response = await api.post(`/v1/payments/razorpay/create-order`, body);

  if (!response.data || !response) {
    throw new Error("unable to create payment order");
    return null;
  }

  const data = response.data;

  try {
    const options: any = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: "Community for Water",
      description: "Donation Payment",
      order_id: data.orderId,
      prefill: {
        name: donationMeta.userDetails.name,
        email: donationMeta.userDetails.email,
      },
      notes: {
        body1: body,
        body: JSON.stringify(body),
      },
      handler: function (response: any) {
        new Promise((resolve) => setTimeout(resolve, 2000));
        const verify = async () => {
          try {
            const res = await verifyRazorepayPaymentAndcreateDonation(response);
            if (res) {
              console.log("payment success", res);
            }
          } catch (error) {
            console.log(
              "error at verifyRazorepayPaymentAndcreateDonation",
              error,
            );
          }
        };
        verify();
        return true;
      },
      theme: {
        color: "#3399cc",
      },
    };
    const razor = new (window as any).Razorpay(options);
    razor.open();
  } catch (error) {
    return false;
  }
};

export const getRazorepayOptions = async ({
  amount,
  donationMeta,
  userMeta,
  currency = "INR",
  redirect_url,
  errorUrl,
  successUrl,
}: {
  amount: number;
  donationMeta: DonationsDocs;
  userMeta: any;
  currency: string;
  redirect_url: string;
  errorUrl: string;
  successUrl: string;
}) => {
  try {
    if (
      !amount ||
      !donationMeta ||
      !currency ||
      !redirect_url ||
      !errorUrl ||
      !successUrl
    ) {
      console.log("handleRazorepayPayment error 1515");
      return false;
    }
    const donationObj: DonationsDocs = donationMeta;
    donationObj.createdAt = new Date().toDateString();

    const body = {
      amount,
      donationMeta: donationObj,
      userMeta: userMeta || {},
      currency,
      redirect_url,
    };

    const response = await axios.post(config.RAZOREPAY_ORDER, body);
    if (response?.data) {
      return response.data;
    } else {
      return false;
    }
  } catch (error) {
    console.log(
      "error at getRazorepayOptions",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
};

export const verifyRazorepayPaymentAndcreateDonation = async (
  body: any,
): Promise<any> => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;
  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return false;
  }
  const res = await api.post("/v1/payments/razorpay/verify-payment", body);
  if (res && res?.status === 200) {
    return res?.data;
  } else {
    return false;
  }
};
