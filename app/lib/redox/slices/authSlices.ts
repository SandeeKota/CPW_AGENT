import { UserSchema } from "@/app/_types/user.type";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;

  user: UserSchema | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true, // Initially true, assuming an auth check will happen
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    SET_ACTIVE_USER: (state, action: PayloadAction<AuthState["user"]>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
      state.error = null;
    },
    REMOVE_ACTIVE_USER: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    SET_AUTH_LOADING: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    SET_AUTH_ERROR: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
});

export const authActions = authSlice.actions;
export default authSlice.reducer;
