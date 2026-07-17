"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/app/stores/authStore";
import cognitoService from "../_services/aws-cognito.service";
import { useDispatch } from "react-redux";
import { getGeoLocationInfo } from "../_services/geo.location.service";
import { GeoIPInfo } from "../_types/geolocation.type";
import { geolocationActions } from "../lib/redox/slices/geolocationSlice";
import { loadRazorpay } from "../utils/api/razorepay.util";
import { SimpleCrossDomainAuth } from "@/lib/simpleCrossDomainAuth";

interface AuthContextType {
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    user,
    isAuthenticated,
    isLoading,
    setLoading,
    login: storeLogin,
    logout: storeLogout,
    initializeAuth,
  } = useAuthStore();

  // Initialize auth state
  useEffect(() => {
    initialize();
  }, [isAuthenticated]);

  async function initialize() {
    try {
      setLoading(true);
      // Handle incoming cross-domain auth first
      const hasIncomingAuth = SimpleCrossDomainAuth.handleIncomingAuth();

      if (hasIncomingAuth) {
        // Wait a bit for localStorage to be updated
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
      initializeAuth();
    }
  }

  // Handle root path redirection
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      if (pathname?.startsWith("/dashboard")) {
        const userRoutes = [
          "/dashboard",
          "/dashboard/fundraisers",
          "/dashboard/donations",
          "/dashboard/myDonations",
          "/dashboard/myBadges",
          "/dashboard/settings",
          "/dashboard/create-fundraise",
        ];
        const isAdmin =
          (user?.role === "admin" || user?.role === "super_admin") &&
          user?.isAdminMode === true;

        if (isAdmin && pathname?.includes("/dashboard/myDonations")) {
          router.replace("/dashboard");
        }
        if (isAdmin && pathname?.includes("/dashboard/myBadges")) {
          router.replace("/dashboard");
        }
        if (!isAdmin && !userRoutes.includes(pathname)) {
          router.replace("/dashboard");
        }
      } else {
        router.replace("/dashboard");
      }
    } else {
      localStorage.clear();
      console.log("Not authenticated");

      router.replace("/auth");
    }
  }, [isAuthenticated, pathname, router, isLoading]);

  const login = async () => {
    initializeAuth();
  };

  const logout = async () => {
    setLoading(true);

    try {
      storeLogout();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
      window.location.href = "/auth";
    }
  };

  return (
    <AuthContext.Provider value={{ login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  const store = useAuthStore();

  if (!context) throw new Error("useAuth must be used within AuthProvider");

  return {
    ...store,
    ...context,
  };
};
