import axios from "axios";
import { GeoIPInfo } from "../_types/geolocation.type";

export const getGeoLocationInfo = async (): Promise<GeoIPInfo | boolean> => {
  try {
    const response = await axios.get("https://ipapi.co/json/");

    if (response?.data) {
      return response?.data as GeoIPInfo;
    }
    return false;
  } catch (error: any) {
    console.error(
      "Error fetching geo location info:",
      error?.message ? error?.message : error || "Unknown error",
    );
    return false;
  }
};
