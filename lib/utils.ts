import api from "@/app/_services/api_service";
import { fileService } from "@/app/utils/fileSevice";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_PROFILE_IMAGE =
  "https://cdn.auth0.com/avatars/default.png";
export const getImageUrl = (image: string) => {
  if (!image?.trim()) {
    return DEFAULT_PROFILE_IMAGE;
  }

  try {
    if (image.includes("https://s.gravatar.com")) {
      const url = new URL(image);
      const defaultImageUrl = new URLSearchParams(url.search).get("d");

      if (defaultImageUrl) {
        return decodeURIComponent(defaultImageUrl);
      } else {
        return DEFAULT_PROFILE_IMAGE;
      }
    }
  } catch (e) {
    console.error("Error parsing image URL:", e);
  }

  return image;
};

export const getImageFromLocal = async (
  file: File,
  enityType: string,
  subPath: string,
) => {
  if (!file) return;
  try {
    const response = await fileService.uploadImage(file, enityType, subPath);
    if (response?.file_key) {
      const signedUrl = await fileService.getPreviewSignedUrl(
        response.file_key,
      );
      if (signedUrl) {
        return signedUrl; // Return the signedURL
      } else {
        return;
      }
    }
  } catch (error) {
    return;
  }
};

export function debounce(func: Function, delay: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export const updateBadges = async () => {
  try {
    const res = await api.get("/v1/badges/add-missing");
  } catch (error) {
    console.log(
      "error at updateBadges",
      error instanceof Error ? error.message : error,
    );
  }
};
