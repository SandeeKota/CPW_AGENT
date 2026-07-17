import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";

export interface FundraiserState {
  isFetching: boolean;
  isFetchingMore: boolean;
  fundraisers: FundraiserSchema[];
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  fundraierToUpdate: FundraiserSchema | null;
}

const initialState: FundraiserState = {
  isFetching: false,
  isFetchingMore: false,
  fundraisers: [],
  error: null,
  currentPage: 1,
  pageSize: 10,
  totalPages: 1,
  totalCount: 0,
  fundraierToUpdate: null,
};

const fundraiserSlice = createSlice({
  name: "fundraiser",
  initialState,
  reducers: {
    fetchFundraisersStart(state) {
      state.isFetching = true;
      state.error = null;
    },
    fetchFundraisersSuccess(
      state,
      action: PayloadAction<{
        fundraisers: FundraiserSchema[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
      }>,
    ) {
      state.isFetching = false;
      state.fundraisers = action.payload.fundraisers;
      state.totalCount = action.payload.totalCount;
      state.totalPages = action.payload.totalPages;
      state.currentPage = action.payload.currentPage;
    },
    fetchFundraisersFailure(state, action: PayloadAction<string>) {
      state.isFetching = false;
      state.error = action.payload;
    },
    fetchMoreFundraisersStart(state) {
      state.isFetchingMore = true;
      state.error = null;
    },
    fetchMoreFundraisersSuccess(
      state,
      action: PayloadAction<{
        fundraisers: FundraiserSchema[];
        currentPage: number;
      }>,
    ) {
      state.isFetchingMore = false;
      state.fundraisers = [...state.fundraisers, ...action.payload.fundraisers];
      state.currentPage = action.payload.currentPage;
    },
    fetchMoreFundraisersFailure(state, action: PayloadAction<string>) {
      state.isFetchingMore = false;
      state.error = action.payload;
    },
    resetFundraisers(state) {
      return initialState;
    },
    addFundraiserToUpdate(
      state,
      action: PayloadAction<FundraiserSchema | null>,
    ) {
      state.fundraierToUpdate = action.payload || null;
    },
  },
});

export const {
  fetchFundraisersStart,
  fetchFundraisersSuccess,
  fetchFundraisersFailure,
  fetchMoreFundraisersStart,
  fetchMoreFundraisersSuccess,
  fetchMoreFundraisersFailure,
  resetFundraisers,
  addFundraiserToUpdate,
} = fundraiserSlice.actions;

export default fundraiserSlice.reducer;
