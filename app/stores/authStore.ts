import { create } from "zustand";
import userSerivice from "../_services/user.service";
import cognitoService from "../_services/aws-cognito.service";
import z from "zod";

export const passwordMatchSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
  );

export type PasswordRule = {
  label: string;
  test: (password: string) => boolean;
};

export const passwordRules: PasswordRule[] = [
  {
    label: "At least 8 characters",
    test: (pwd) => pwd.length >= 8,
  },
  {
    label: "One uppercase letter (A–Z)",
    test: (pwd) => /[A-Z]/.test(pwd),
  },
  {
    label: "One lowercase letter (a–z)",
    test: (pwd) => /[a-z]/.test(pwd),
  },
  {
    label: "One number (0–9)",
    test: (pwd) => /\d/.test(pwd),
  },
  {
    label: "One special character (@$!%*?&)",
    test: (pwd) => /[@$!%*?&]/.test(pwd),
  },
];

export interface User {
  _id: string;
  username: string;
  email: string;
  name: string;

  sub?: string;
  email_verified?: boolean;
  nickname?: string;
  picture?: string;
  updated_at?: string;
  given_name?: string;
  family_name?: string;
  createdAt?: string;
  role?: "admin" | "fundraiser" | "user" | "ca" | "super_admin";
  isAdminMode?: boolean;
  phone?: string;
  dial_code?: string;
  password?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  login: (userData: { user: User; token: string }) => void;
  logout: () => void;
  initializeAuth: () => void;
  authStatuChange: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  clearUser: () => set({ user: null, isAuthenticated: false }),

  setLoading: (loading) => set({ isLoading: loading }),

  login: (userData) => {
    set({
      user: userData.user,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    await cognitoService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  // Initialize auth from localStorage
  initializeAuth: async () => {
    try {
      set({
        isLoading: true,
      });
      let response;
      const token = await cognitoService.getSession();
      if (token) {
        response = await userSerivice.userData();
      }

      if (response) {
        set({
          user: response,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      // Clear corrupted data
      localStorage.removeItem("access_token");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
  authStatuChange: (status: boolean) => {
    set({ isAuthenticated: status });
  },
}));
