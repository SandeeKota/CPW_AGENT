import axios from "axios";
import cognitoService from "./aws-cognito.service";
import config from "../config/config";

const api = axios.create({
  baseURL: config.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// FOR REQUEST
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const token = await cognitoService.getSession();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    Promise.resolve(error);
  },
);

// FOR RESPONSE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error) {
      if (error) {
        throw error;
      }
    }
  },
);

export default api;
