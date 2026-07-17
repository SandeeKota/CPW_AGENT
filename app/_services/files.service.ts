import api from "./api_service";

export type ContentTypeGroup = "" | "image" | "pdf" | "text" | "other";

export type AdminSavedFileItem = {
  id: string;
  original_name: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
  bucket_name: string;
  s3_key: string;
  s3_url: string;
  uploaded_by?: {
    user_id?: string;
    email?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type AdminSavedFilesPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AdminSavedFilesResult = {
  items: AdminSavedFileItem[];
  pagination: AdminSavedFilesPagination;
  filters: {
    search: string;
    contentTypeGroup: string;
    from: string;
    to: string;
  };
};

export type GetAdminSavedFilesParams = {
  page?: number;
  limit?: number;
  search?: string;
  contentTypeGroup?: ContentTypeGroup;
  from?: string;
  to?: string;
};

export const getAdminSavedFiles = async (
  params: GetAdminSavedFilesParams,
): Promise<AdminSavedFilesResult> => {
  const response = await api.get("/v1/files", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
      contentTypeGroup: params.contentTypeGroup || undefined,
      from: params.from || undefined,
      to: params.to || undefined,
    },
  });

  return response.data.result as AdminSavedFilesResult;
};

export const saveAdminFiles = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("file", file);
  });

  const response = await api.post("/v1/files/save", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getAdminFileAccessUrl = async (id: string): Promise<string> => {
  const response = await api.get(`/v1/files/${id}/access-url`);
  return String(response?.data?.result?.access_url || "");
};

export const deleteAdminFile = async (id: string) => {
  const response = await api.delete(`/v1/files/${id}`);
  return response.data;
};
