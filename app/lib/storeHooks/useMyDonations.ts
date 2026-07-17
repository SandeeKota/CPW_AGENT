import { useEffect, useState } from "react";
import api from "@/app/_services/api_service";
import { DonationsLookupModal } from "@/app/_types/dination.type";
import { fetchSubscriptionStatusesForDonations } from "./useDonations";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
}

interface MyDonationsResponse {
  success: boolean;
  data: DonationsLookupModal[];
  pagination: Pagination;
  totalDonationAmount: number;
  totalByGBP: number;
  totalByEUR: number;
  totalByINR: number;
  totalByUSD: number;
}

export const useMyDonationsHook = (
  initialPage?: number,
  initialPerPage?: number,
) => {
  const [donations, setDonations] = useState<DonationsLookupModal[]>([]);
  const [totalDonationAmount, setTotalDonationAmount] = useState<number>(0);
  const [totalINR, setTotalINR] = useState<number>(0);
  const [totalUSD, setTotalUSD] = useState<number>(0);
  const [totalEUR, setTotalEUR] = useState<number>(0);
  const [totalGBP, setTotalGBP] = useState<number>(0);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    perPage: initialPerPage || 0,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionStatusLoading, setSubscriptionStatusLoading] =
    useState<boolean>(false);

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

  const fetchMyDonations = async (
    page?: number,
    pageSize?: number,
    searchQuery?: string,
    date?: string,
    currency?: string,
    fundraiser_id?: string,
  ) => {
    try {
      setLoading(searchQuery ? false : true);
      let url = `/v1/donations/my-donations?page=${page || ""}&perPage=${pageSize || 10}&search=${searchQuery || ""}&date=${date || ""}&currency=${currency || "INR"}`;
      if (fundraiser_id) {
        url += `&fundraiser_id=${fundraiser_id}`;
      }
      const response = await api.get(url);
      const resData: MyDonationsResponse = response.data;

      if (resData.success) {
        setDonations(resData.data);
        setPagination(resData.pagination);
        setTotalDonationAmount(resData.totalDonationAmount);
        setTotalINR(resData.totalByINR || 0);
        setTotalUSD(resData.totalByUSD || 0);
        setTotalEUR(resData.totalByEUR || 0);
        setTotalGBP(resData.totalByGBP || 0);
        setError(null);
        void fetchSubscriptionStatuses(resData.data);
      } else {
        setTotalDonationAmount(0);
        setTotalINR(resData.totalByINR || 0);
        setTotalUSD(resData.totalByUSD || 0);
        setTotalEUR(resData.totalByEUR || 0);
        setTotalGBP(resData.totalByGBP || 0);
        setError("Failed to fetch donations");
      }
    } catch (err) {
      setError("An error occurred while fetching donations");
      setDonations([]);
      setTotalDonationAmount(0);
      setTotalINR(0);
      setTotalUSD(0);
      setTotalEUR(0);
      setTotalGBP(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyDonations();
  }, []);

  return {
    donations,
    pagination,
    loading,
    error,
    totalDonationAmount,
    totalEUR,
    totalGBP,
    totalINR,
    totalUSD,
    fetchMyDonations,
    subscriptionStatusLoading,
  };
};
