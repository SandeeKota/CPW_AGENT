import {
  Ambassador,
  AmbassadorApplyInput,
  AmbassadorListResult,
  AmbassadorPagination,
  AmbassadorStatus,
  AmbassadorUpdateInput,
  ambassadorApplySchema,
  ambassadorUpdateSchema,
} from "@/app/_types/ambassador.type";
import api from "./api_service";

interface AmbassadorApiResponse {
  error: boolean;
  message?: string;
  details?: string;
  data?: any;
  pagination?: AmbassadorPagination;
}

const DEFAULT_PAGINATION: AmbassadorPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const parseApiError = (error: any, fallback: string): string => {
  return (
    error?.response?.data?.details ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

export const getAllAmbassadors = async ({
  page = 1,
  limit = 10,
  search = "",
  status,
}: {
  page?: number;
  limit?: number;
  search?: string;
  status?: AmbassadorStatus;
}): Promise<AmbassadorListResult> => {
  try {
    const response = await api.get<AmbassadorApiResponse>("/v1/ambassador", {
      params: { page, limit, search, status },
    });

    if (response.status !== 200 || response.data?.error) {
      throw new Error(response.data?.message || "Unable to fetch ambassadors.");
    }

    return {
      data: (response.data?.data || []) as Ambassador[],
      pagination: response.data?.pagination || DEFAULT_PAGINATION,
    };
  } catch (error: any) {
    throw new Error(parseApiError(error, "Unable to fetch ambassadors."));
  }
};

export const getAmbassadorById = async (id: string): Promise<Ambassador> => {
  try {
    const response = await api.get<AmbassadorApiResponse>(
      `/v1/ambassador/${id}`,
    );

    if (
      response.status !== 200 ||
      response.data?.error ||
      !response.data?.data
    ) {
      throw new Error(
        response.data?.message || "Unable to fetch ambassador details.",
      );
    }

    return response.data.data as Ambassador;
  } catch (error: any) {
    throw new Error(
      parseApiError(error, "Unable to fetch ambassador details."),
    );
  }
};

export const createAmbassador = async (payload: AmbassadorApplyInput) => {
  try {
    const validated = ambassadorApplySchema.parse(payload);
    const response = await api.post<AmbassadorApiResponse>(
      "/v1/ambassador/apply",
      validated,
    );

    if (response.status !== 201 || response.data?.error) {
      throw new Error(
        response.data?.message || "Unable to create ambassador application.",
      );
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      parseApiError(error, "Unable to create ambassador application."),
    );
  }
};

export const updateAmbassador = async (
  id: string,
  payload: AmbassadorUpdateInput,
) => {
  try {
    const validated = ambassadorUpdateSchema.parse(payload);
    const response = await api.put<AmbassadorApiResponse>(
      `/v1/ambassador/${id}`,
      validated,
    );

    if (response.status !== 200 || response.data?.error) {
      throw new Error(
        response.data?.message || "Unable to update ambassador application.",
      );
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      parseApiError(error, "Unable to update ambassador application."),
    );
  }
};

export const deleteAmbassador = async (id: string) => {
  try {
    const response = await api.delete<AmbassadorApiResponse>(
      `/v1/ambassador/${id}`,
    );

    if (response.status !== 200 || response.data?.error) {
      throw new Error(
        response.data?.message || "Unable to delete ambassador application.",
      );
    }

    return response.data;
  } catch (error: any) {
    throw new Error(
      parseApiError(error, "Unable to delete ambassador application."),
    );
  }
};
