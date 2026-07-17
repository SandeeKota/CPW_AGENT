import config from "@/app/config/config";

// Types for API requests and responses
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      name: string;
    };
    token: string;
  };
  message: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

// API Base URL - adjust according to your backend
const API_BASE_URL = config.baseUrl;

// Generic API call function
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Something went wrong");
    }

    return data;
  } catch (error) {
    console.error("API call error:", error);
    throw error;
  }
}

// Auth API functions
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    return apiCall<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },

  // Register
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const encodePass = btoa(userData.password);
    const user = { ...userData, password: encodePass };
    return apiCall<RegisterResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },
};
