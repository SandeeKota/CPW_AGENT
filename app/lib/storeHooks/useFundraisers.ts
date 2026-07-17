import { useState } from "react";
import api from "@/app/_services/api_service";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { ProjectRemainingAmountResponse } from "./useProjects";

interface FundraisersResponse {
  total: number;
  page: number;
  limit: number;
  fundraisers: FundraiserSchema[];
}

export const useFundraisers = () => {
  const [fundraisers, setFundraisers] = useState<FundraiserSchema[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageCurrent, setPageCurrent] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFundraisers = async (
    query: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {},
  ) => {
    const { page, limit, status, search } = query;

    try {
      setLoading(search ? false : true);
      const res = await api.get("/v1/fundraisers/my-campaigns", {
        params: {
          page: page || "",
          limit: limit || "",
          status: status || "",
          search: search || "",
        },
      });

      const response: FundraisersResponse = res.data;
      if (res.status === 200 && response.fundraisers) {
        setFundraisers(response.fundraisers);
        setTotal(response.total);
        setPageCurrent(response.page || 1);
        setTotalPages(
          Math.max(1, Math.ceil((response.total || 0) / (response.limit || 1))),
        );
        setError(null);
      } else {
        throw new Error("Invalid response from fundraiser API");
      }
    } catch (err) {
      console.error("Fundraiser Fetch Error:", err);
      setError("Unable to load fundraisers");
      setFundraisers([]);
      setTotal(0);
      setPageCurrent(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const addFundraiser = async (fundraiser: FundraiserSchema) => {
    try {
      const parseData = FundraiserSchema.safeParse(fundraiser);
      if (!parseData.success) {
        return false;
      }

      setFundraisers([...fundraisers, fundraiser]);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getFundraiser = async (id: string) => {
    try {
      if (!id || id.trim().length <= 0) {
        throw new Error("Fundraiser ID is required");
      }
      const response = await api.get(`/v1/fundraisers/${id}/public`);
      if (response && response?.data && response?.data?.fundraiser) {
        return response.data.fundraiser as any;
      } else {
        throw new Error("Fundraiser not found");
      }
    } catch (error) {
      console.error("Error fetching fundraiser:", error);
      return false;
    }
  };
  return {
    fundraisers,
    total,
    totalPages,
    pageCurrent,
    loading,
    error,
    fetchFundraisers,
    addFundraiser,
    getFundraiser,
  };
};

export const getFundraiserRemainingAmount = async (projectId: string) => {
  try {
    const res = await api.get(`/v1/fundraisers/${projectId}/remaining`);
    if (res.data && res.status === 200) {
      return res.data as ProjectRemainingAmountResponse;
    } else throw new Error("Something went wrong");
  } catch (error) {
    return false;
  }
};
