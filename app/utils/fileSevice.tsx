import api from "../_services/api_service";
import config from "../config/config";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { makeStore } from "../lib/redox/store";

export interface SelectedImage extends FileItem {
  width: number;
  height: number;
}
export interface FileItem {
  uri: string;
  fileName: string | undefined | null;
  fileSize: number | undefined | null;
  type: string | undefined | null;
}

async function uploadSignedUrl(file_name: string): Promise<string> {
  const payload = { file_name };
  try {
    const resp = await api.post("/uploadurl", payload);
    const signedUrl = resp?.data?.result?.signedUrl;

    if (!signedUrl) throw new Error("Signed URL not received");
    return signedUrl;
  } catch (error) {
    throw error;
  }
}

const generateUniqueFileKey = (originalFilename: string): string => {
  const extension = originalFilename.split(".").pop(); // Extract file extension
  const name = originalFilename
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9]/g, "_"); // Clean filename

  const userData = makeStore().getState()?.auth?.user;
  const userId = userData?._id || "anonymous";
  const timestamp = new Date().getTime();

  return `${userId}-${name}-${timestamp}.${extension}`;
};

const uploadImage = async (
  file: File,
  entityType: string,
  subPath?: string,
) => {
  try {
    const fileName = file.name || "";
    let uniqueKey = generateUniqueFileKey(fileName);

    if (subPath?.trim()) {
      subPath = subPath.replace(/^\/+|\/+$/g, "").replace(/\s/g, "-"); // Clean subPath
      uniqueKey = `${entityType}/${subPath}/${uniqueKey}`;
    } else {
      uniqueKey = `${entityType}/${uniqueKey}`;
    }

    // Get Signed URL
    const signedUrl = await uploadSignedUrl(uniqueKey);

    // Upload File to S3 using Signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type, // Ensure correct file type
      },
    });

    if (uploadResponse.ok) {
      return {
        file_key: uniqueKey,
      };
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const filePreviewPath = (file_key: string) => {
  return `${config.CloudfrontS3}${file_key}`;
};
const getPreviewSignedUrl = async (file_name: string) => {
  try {
    return filePreviewPath(file_name);
  } catch (error) {
    throw error;
    return null;
  }
};

export const fileService = { uploadImage, getPreviewSignedUrl };

export const handleDownload = async (url: string, filename: string) => {
  const res = await fetch(url, { mode: "cors" }); // Allow cross-origin
  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const handleBulkDownload = async (
  pdfList: { name: string; pdfUrl: string }[],
  formate: string,
  fileName: string,
) => {
  const zip = new JSZip();

  for (let i = 0; i < pdfList.length; i++) {
    const { name, pdfUrl } = pdfList[i];
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const safeName = name.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      zip.file(`${i + 1}_${safeName}${formate}`, blob);
    } catch (err) {
      console.error(`Failed to fetch ${pdfUrl}:`, err);
    }
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, fileName || "cpw_pdfs");
};

const getFileNameFromContentDisposition = (contentDisposition?: string) => {
  const fileNameMatch = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return fileNameMatch?.[1] || "";
};

const getBlobErrorMessage = async (data: unknown) => {
  if (!(data instanceof Blob)) return "";

  try {
    const text = await data.text();
    if (!text) return "";
    const parsed = JSON.parse(text);
    return parsed?.message || parsed?.error || "";
  } catch (error) {
    return "";
  }
};

export const download80GDonationDetailsXlsx = async () => {
  try {
    const response = await api.get("/v1/donations/80g-report", {
      responseType: "blob",
    });
    const fileName =
      getFileNameFromContentDisposition(
        response.headers?.["content-disposition"],
      ) || `80g_donation_details_${new Date().toISOString().slice(0, 10)}.xlsx`;

    saveAs(response.data, fileName);
    return true;
  } catch (error: any) {
    const message =
      (await getBlobErrorMessage(error?.response?.data)) ||
      error?.response?.data?.message ||
      "Unable to export 80G donation details.";
    throw new Error(message);
  }
};

export const allPdfLinksdonations = async () => {
  try {
    const response = await api.get("/v1/donations/pdf-receipts");
    if (response?.data && response?.data?.data) {
      return response?.data?.data as { name: string; pdfUrl: string };
    }
    return false;
  } catch (error) {
    console.error("Error  fetching donations PDF links:", error);
    return false;
  }
};
export const getAllFundraiseDonaionsLink = async () => {
  try {
    const response = await api.get("/v1/donations/my-pdf-receipts");
    if (response?.data && response?.data?.data) {
      return response?.data?.data as { name: string; pdfUrl: string };
    }
    return false;
  } catch (error) {
    console.error("Error  fetching donations PDF links:", error);
    return false;
  }
};
export const allVerixImagesLink = async () => {
  try {
    const response = await api.get("/v1/donations/verification-images");
    if (response?.data && response?.data?.data) {
      return response?.data?.data as { name: string; pdfUrl: string };
    }
    return false;
  } catch (error) {
    console.error("Error  fetching verix images links:", error);
    return false;
  }
};
export const getAllMyVerixLinks = async () => {
  try {
    const response = await api.get("/v1/donations/my-verification-images");
    if (response?.data && response?.data?.data) {
      return response?.data?.data as { name: string; pdfUrl: string };
    }
    return false;
  } catch (error) {
    console.error("Error  fetching verix images links:", error);
    return false;
  }
};
