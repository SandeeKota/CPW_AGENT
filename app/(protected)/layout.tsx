"use client";

import { redirect } from "next/navigation";
import { useAuthStore } from "../stores/authStore";
import { useDispatch } from "react-redux";
import { useEffect } from "react";
import { loadRazorpay } from "../utils/api/razorepay.util";
import { getGeoLocationInfo } from "../_services/geo.location.service";
import { GeoIPInfo } from "../_types/geolocation.type";
import { geolocationActions } from "../lib/redox/slices/geolocationSlice";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuthStore();

  const dispatch = useDispatch();
  useEffect(() => {
    loadRazorpay();
    loadLoation();
  }, []);

  const loadLoation = async () => {
    const geoLocations = await getGeoLocationInfo();
    if (geoLocations) {
      dispatch(geolocationActions.setGeolocation(geoLocations as GeoIPInfo));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Protected routes navbar/sidebar */}
      <nav className="bg-white shadow-sm border-b">
        {/* Navigation for protected routes */}
      </nav>
      <main>{children}</main>
    </div>
  );
}
