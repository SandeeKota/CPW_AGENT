import api from "@/app/_services/api_service";
import type { DonationsLookupModal } from "../../_types/dination.type";
import { useState } from "react";
interface DonationResponse {
  donations: DonationsLookupModal[];
  donorsCount: number;
  totalDonationAmount: number;
  totalByGBP: number;
  totalByEUR: number;
  totalByINR: number;
  totalByUSD: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    perPage: number;
  };
}

type DonationFilters = {
  fundraiser_id?: string;
  donation_type?: "oneTime" | "monthly" | "";
  has_tax_exemption?: "true" | "false" | "";
};

type SubscriptionStatusItem = {
  subscription_id?: string;
  id?: string;
  status?: string;
  payment_details?: Array<{
    invoice_id?: string;
    invoice_status?: string;
    amount_paid?: number;
    currency?: string;
    paid_at?: string;
    invoice_pdf?: string;
    hosted_invoice_url?: string;
    is_really_paid?: boolean;
  }>;
};

type NormalizedSubscriptionMap = Record<
  string,
  {
    status?: string;
    payment_details?: SubscriptionStatusItem["payment_details"];
  }
>;

const normalizeStatusMap = (payload: any): NormalizedSubscriptionMap => {
  const mapped: NormalizedSubscriptionMap = {};

  if (Array.isArray(payload)) {
    payload.forEach((item: SubscriptionStatusItem) => {
      const id = item?.subscription_id || item?.id;
      if (id) {
        mapped[id] = {
          status: item?.status,
          payment_details: Array.isArray(item?.payment_details)
            ? item.payment_details
            : undefined,
        };
      }
    });
    return mapped;
  }

  if (payload && typeof payload === "object") {
    Object.keys(payload).forEach((key) => {
      const value = payload[key];
      if (typeof value === "string") {
        mapped[key] = { status: value };
      } else if (value && typeof value === "object") {
        mapped[key] = {
          status: typeof value.status === "string" ? value.status : undefined,
          payment_details: Array.isArray(value.payment_details)
            ? value.payment_details
            : undefined,
        };
      }
    });
  }

  return mapped;
};

export const fetchSubscriptionStatusesForDonations = async (
  sourceList: DonationsLookupModal[],
): Promise<DonationsLookupModal[]> => {
  const subscriptionPayload: { provider: string; subscription_id: string }[] =
    [];
  const seenSubscriptions = new Set<string>();

  (sourceList || []).forEach((donation) => {
    const subId = donation?.subscription_id;
    if (subId && !seenSubscriptions.has(subId)) {
      seenSubscriptions.add(subId);
      subscriptionPayload.push({
        provider: donation?.paymentDetails?.provider || "stripe",
        subscription_id: subId,
      });
    }
  });

  if (subscriptionPayload.length <= 0) {
    return sourceList || [];
  }

  try {
    const subRes = await api.post("/v1/payments/stripe/subscriptions/status", {
      subscription_ids: subscriptionPayload,
    });
    const subPayload = subRes?.data?.data ?? subRes?.data;
    const statusMap = normalizeStatusMap(subPayload);

    if (!statusMap || Object.keys(statusMap).length <= 0) {
      return sourceList || [];
    }

    return (sourceList || []).map((donation) => ({
      ...donation,
      subscription_status: donation?.subscription_id
        ? statusMap[donation.subscription_id]?.status ||
          donation?.subscription_status
        : donation?.subscription_status,
      payment_details: donation?.subscription_id
        ? statusMap[donation.subscription_id]?.payment_details ||
          donation?.payment_details
        : donation?.payment_details,
    }));
  } catch (subscriptionErr) {
    return sourceList || [];
  }
};

export const fetchSubscriptionStatuses = fetchSubscriptionStatusesForDonations;

export const useDonationsHook = () => {
  const [donations, setDonations] = useState<DonationsLookupModal[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalDonationAmount, setTotalDonationAmount] = useState<number>(0);
  const [totalINR, setTotalINR] = useState<number>(0);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [totalEUR, setTotalEUR] = useState<number>(0);
  const [totalGBP, setTotalGBP] = useState<number>(0);
  const [donorsCount, setDonorsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [subscriptionStatusLoading, setSubscriptionStatusLoading] =
    useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [analyticsLoading, setAnalyticsLoading] = useState<boolean>(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsCards, setAnalyticsCards] = useState<any | null>(null);

  const fetchSubscriptionStatuses = async (
    donationsListInput?: DonationsLookupModal[],
  ): Promise<void> => {
    const sourceList = donationsListInput || donations || [];

    try {
      setSubscriptionStatusLoading(true);
      const updatedDonations =
        await fetchSubscriptionStatusesForDonations(sourceList);
      setDonations(updatedDonations);
    } catch (subscriptionErr) {
      // Keep list rendering resilient if subscription status API fails.
    } finally {
      setSubscriptionStatusLoading(false);
    }
  };

  const fetchDonations = async (
    page?: number,
    pageSize?: number,
    searchQuery?: string,
    date?: string,
    currency?: string,
    filters: DonationFilters = {},
  ) => {
    try {
      setLoading(searchQuery ? false : true);
      const params = new URLSearchParams();
      if (page) params.set("page", String(page));
      if (pageSize) params.set("pageSize", String(pageSize));
      if (searchQuery) params.set("search", searchQuery);
      if (date) params.set("date", date);
      params.set("currency", currency || "INR");
      if (filters.fundraiser_id)
        params.set("fundraiser_id", filters.fundraiser_id);
      if (filters.donation_type)
        params.set("donation_type", filters.donation_type);
      if (filters.has_tax_exemption)
        params.set("has_tax_exemption", filters.has_tax_exemption);

      const res = await api.get(`/v1/donations?${params.toString()}`);
      const response: DonationResponse = res.data;

      if (res.status === 200 && response.donations) {
        const donationsList = response.donations || [];
        setDonations(donationsList);
        setTotalPages(response.pagination.totalPages || 1);
        setCurrentPage(response.pagination.currentPage || 1);
        setTotalCount(response.pagination.totalCount || 0);
        setDonorsCount(response.donorsCount || 0);
        setTotalDonationAmount(response.totalDonationAmount || 0);
        setTotalINR(response.totalByINR || 0);
        setTotalUSD(response.totalByUSD || 0);
        setTotalEUR(response.totalByEUR || 0);
        setTotalGBP(response.totalByGBP || 0);
        void fetchSubscriptionStatuses(donationsList);
        setError(null);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      setError("Error fetching donations");
      setDonations([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalCount(0);
      setDonorsCount(0);
      setTotalDonationAmount(0);
      setTotalINR(0);
      setTotalUSD(0);
      setTotalEUR(0);
      setTotalGBP(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchDonationsAnalytics = async (currency: string) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const res = await api.get(
        `/v1/donations/analytics?currency=${currency || "INR"}`,
      );
      if (res && res.status === 200 && res.data) {
        setAnalyticsCards(res.data);
      } else {
        throw new Error("Invalid response");
      }
    } catch (err) {
      setAnalyticsError("Error fetching donations analytics");
      setAnalyticsCards(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return {
    donations,
    totalPages,
    currentPage,
    totalCount,
    loading,
    subscriptionStatusLoading,
    error,
    donorsCount,
    totalDonationAmount,
    totalEUR,
    totalGBP,
    totalINR,
    totalUSD,
    fetchDonations,
    fetchSubscriptionStatuses,
    analyticsLoading,
    analyticsError,
    analyticsCards,
    fetchDonationsAnalytics,
  };
};
