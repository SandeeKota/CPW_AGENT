import { FundraiserFormValues } from "../_types/fundraiser.types";
import api from "./api_service";

export const createFundraiser = async (body: Partial<FundraiserFormValues>) => {
  try {
    const res = await api.post("/v1/fundraisers", body);
    if (res && res?.data?.fundraiser) {
      return res?.data?.fundraiser;
    } else {
      throw new Error("Failed to update fundraiser");
    }
  } catch (error) {
    return false;
  }
};
export const updateFundraiser = async (
  body: Partial<FundraiserFormValues>,
  id: string,
) => {
  try {
    const res = await api.put(`/v1/fundraisers/${id}`, body);
    if (res && res?.data?.fundraiser) {
      return res?.data?.fundraiser;
    } else {
      throw new Error("Failed to update fundraiser");
    }
  } catch (error) {
    return false;
  }
};

export const getFundraiserFilterList = async () => {
  try {
    const res = await api.get("/v1/fundraisers/filter-list");
    if (res && res.data && res.data.fundraisers) {
      return res.data.fundraisers;
    } else {
      throw new Error("Failed to fetch filter list");
    }
  } catch (error) {
    return [];
  }
};
