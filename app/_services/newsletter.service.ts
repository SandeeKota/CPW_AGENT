import api from "./api_service";

export interface NewsletterSubscriber {
  _id?: string;
  email: string;
  createdAt?: string;
  subscribed?: boolean;
  isSubscribed?: boolean;
  status?: string;
}

interface NewsletterPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface NewsletterApiResponse {
  error: boolean;
  message?: string;
  data?: NewsletterSubscriber[];
  pagination?: NewsletterPagination;
}

export interface NewsletterSubscribersResult {
  data: NewsletterSubscriber[];
  pagination: NewsletterPagination;
}

const DEFAULT_PAGINATION: NewsletterPagination = {
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 1,
};

export const getNewsletterSubscribers = async (
  page = 1,
  limit = 20,
  search = "",
  subscribed?: boolean,
): Promise<NewsletterSubscribersResult> => {
  try {
    const response = await api.get<NewsletterApiResponse>(
      "/v1/newsletter/subscribers",
      {
        params: { page, limit, search, subscribed },
      },
    );

    if (response.status !== 200 || response.data?.error) {
      throw new Error(response.data?.message || "Unable to load subscribers.");
    }

    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || DEFAULT_PAGINATION,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Unable to load subscribers.";

    throw new Error(message);
  }
};

export const getNewsletterUnsubscribers = async (
  page = 1,
  limit = 20,
  search = "",
): Promise<NewsletterSubscribersResult> => {
  try {
    const response = await api.get<NewsletterApiResponse>(
      "/v1/newsletter/un-subscribers",
      {
        params: { page, limit, search },
      },
    );

    if (response.status !== 200 || response.data?.error) {
      throw new Error(
        response.data?.message || "Unable to load un-subscribers.",
      );
    }

    return {
      data: response.data?.data || [],
      pagination: response.data?.pagination || DEFAULT_PAGINATION,
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Unable to load un-subscribers.";

    throw new Error(message);
  }
};

export const unsubscribeEmail = async (
  email: string,
): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.put("/v1/newsletter/un-subscribers", { email });

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(response.data?.message || "Failed to unsubscribe email.");
    }

    return {
      success: true,
      message: response.data?.message || "Email unsubscribed successfully.",
    };
  } catch (error: any) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message ||
      "Failed to unsubscribe email.";

    throw new Error(message);
  }
};
