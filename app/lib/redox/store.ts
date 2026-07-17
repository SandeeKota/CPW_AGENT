// lib/redux/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authSlices, { authSlice } from "./slices/authSlices";
import fundraiser from "./slices/fundraiser.slice";
import geolocationSlice from "./slices/geolocationSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authSlices,
      fundraiser: fundraiser,
      geoLocationSlice: geolocationSlice.reducer,
      // Add other reducers here
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
