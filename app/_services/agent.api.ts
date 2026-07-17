import axios from "axios";
import cognitoService from "./aws-cognito.service";
import config from "../config/config";

const agentApi = axios.create({
  baseURL: config.agentBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach auth token from Cognito session
agentApi.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      try {
        const token = await cognitoService.getSession();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // Continue without auth for optional-auth endpoints
      }
    }
    return config;
  },
  (error) => Promise.resolve(error),
);

agentApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error) {
      throw error;
    }
  },
);

export default agentApi;
