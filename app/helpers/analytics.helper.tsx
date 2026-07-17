import { useEffect, useState } from "react";
import api from "../_services/api_service";

export type DashboardAnalyticsCards = {
  totalRaised: number;
  totalActiveProjects: number;
  totalActiveFundraisers: number;
  totalDonors: number;
  averageDonations: number;
};

export interface MonthlyDonation {
  amount: number;
  date: string; // "YYYY-MM-DD"
  month: string; // e.g. "MAY-2025"
  fullMothDate: string; // ISO string, e.g. "2025-05-01T00:00:00.000Z"
}

export interface ProjectDitributions {
  name: string;
  value: number;
  raised: number;
  goal: number;
  color: string;
  currency_type: string;
}

export interface MonthlyDonorCount {
  month: string; // e.g. "JUN"
  date: string; // e.g. "2024-06-01"
  fullMonthDate: string; // e.g. "2024-05-31T18:30:00.000Z"
  donors: number; // number of donors this month
}

export const analyticsDashboard = {
  getDashboardCards: async (
    currency: string,
  ): Promise<DashboardAnalyticsCards | null> => {
    try {
      const response = await api.get(
        `/v1/analytics/dashboard-cards?currency=${currency || ""}`,
      );
      if (
        response &&
        response?.data &&
        response?.data?.success &&
        response?.data?.data
      ) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching dashboard card:", error);
      return null;
    }
  },
  getMonthlyDonations: async (
    id: string,
    curency = "INR",
  ): Promise<MonthlyDonation[] | null> => {
    try {
      const response = await api.get(
        `/v1/analytics/monthly-donations/?currency=${curency}&id=${id || ""}`,
      );
      if (
        response &&
        response?.data &&
        response?.data?.success &&
        response?.data?.data
      ) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching monthly donations:", error);
      return null;
    }
  },
  getMonthlyDonorsCount: async (): Promise<MonthlyDonorCount[] | null> => {
    try {
      const response = await api.get(`/v1/analytics/donor-growth`);
      if (
        response &&
        response?.data &&
        response?.data?.success &&
        response?.data?.data
      ) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching monthly donations:", error);
      return null;
    }
  },
  getProjectDistripbutions: async (
    date: string,
  ): Promise<ProjectDitributions[] | null> => {
    try {
      const response = await api.get(
        `/v1/analytics/project-distributions?date=${date}`,
      );
      if (
        response &&
        response?.data &&
        response?.data?.success &&
        response?.data?.data
      ) {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching monthly donations:", error);
      return null;
    }
  },
};

export const useDashboardAnalytics = (userId: string) => {
  const [cards, setCards] = useState<DashboardAnalyticsCards | null>(null);
  const [monthlyDonations, setMonthlyDonations] = useState<
    MonthlyDonation[] | null
  >(null);
  const [monthlyDonors, setMonthlyDonors] = useState<
    MonthlyDonorCount[] | null
  >(null);
  const [distributions, setDistributions] = useState<
    ProjectDitributions[] | null
  >(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlayticsCards = async (currency: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsDashboard.getDashboardCards(currency);
      setCards(result);
    } catch (err) {
      setError("Failed to fetch dashboard analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectDitributions = async (date: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsDashboard.getProjectDistripbutions(date);
      setDistributions(result || []);
    } catch (err) {
      setDistributions([]);
      setError("Failed to fetch dashboard analytics");
    } finally {
      setLoading(false);
    }
  };
  const fetchMonthlyDonations = async (currency: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsDashboard.getMonthlyDonations(
        userId,
        currency,
      );
      setMonthlyDonations(result || []);
    } catch (err) {
      setMonthlyDonations([]);
      setError("Failed to fetch dashboard analytics");
    } finally {
      setLoading(false);
    }
  };
  const fetchMonthlyDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyticsDashboard.getMonthlyDonorsCount();
      setMonthlyDonors(result || []);
    } catch (err) {
      setMonthlyDonors([]);
      setError("Failed to fetch month donars analytics");
    } finally {
      setLoading(false);
    }
  };

  const impactsToSettings = async (selectedCurrency?: string) => {
    try {
      const res = await api.get(
        `/v1/analytics/impact-settings?currency=${selectedCurrency || ""}`,
      );
      if (res && res?.status === 200 && res?.data && res?.data?.data) {
        return res?.data?.data;
      }
      return false;
    } catch (error) {
      console.log(
        "error at impactsToSettings",
        error instanceof Error ? error.message : error,
      );
      return false;
    }
  };

  return {
    cards,
    monthlyDonations,
    distributions,
    loading,
    error,
    monthlyDonors,
    fetchAlayticsCards,
    fetchMonthlyDonations,
    fetchProjectDitributions,
    fetchMonthlyDonors,
    impactsToSettings,
  };
};
