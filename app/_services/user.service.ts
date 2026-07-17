import axios from "axios";
import config from "../config/config";
import api from "./api_service";

const { baseUrl } = config;

const userSerivice = {
  accountAccessCheck: async (email: string) => {
    const uri = `${baseUrl}/auth/registration/status/${email}`;
    let output = { error: true, message: "" };
    try {
      const response = await axios.get(uri);
      if (response && response.status === 200) {
        output = { error: false, message: response.data.message };
      } else {
        output = {
          error: true,
          message:
            "Email address not found in our records. Please check the email address or sign up to get started.",
        };
      }
    } catch (error) {
      output = {
        error: true,
        message:
          "Email address not found in our records. Please check the email address or sign up to get started.",
      };
    }
    return output;
  },

  userData: async () => {
    try {
      const uri = `${baseUrl}/auth/user`;
      const response = await api.get(uri);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getCognitoUser: async (email: string) => {
    console.log(email);

    const uri = `${baseUrl}/auth/registration/get-cognito-user/${email}`;
    let output = { error: true, message: "", data: null };
    try {
      const response = await axios.get(uri);
      if (
        response &&
        response.status === 200 &&
        response.data &&
        response.data.data
      ) {
        output = {
          error: false,
          message: response.data.message,
          data: response.data?.data,
        };
      } else {
        output = {
          error: true,
          message:
            "Email address not found in our records. Please check the email address or sign up to get started.",
          data: null,
        };
      }
    } catch (error) {
      output = {
        error: true,
        message:
          "Email address not found in our records. Please check the email address or sign up to get started.",
        data: null,
      };
    }
    return output;
  },
  requestForgotPasswordOTP: async (email: string) => {
    const uri = `${baseUrl}/auth/forgot-password`;
    let output = { error: true, message: "", data: null };
    try {
      const response = await api.post(uri, { email });

      if (response && response.status === 200) {
        output = {
          error: false,
          message: response.data.message,
          data: response.data,
        };
      } else {
        output = {
          error: true,
          message: "Failed to send OTP. Please try again later.",
          data: null,
        };
      }
    } catch (error) {
      output = {
        error: true,
        message: "Failed to send OTP. Please try again later.",
        data: null,
      };
    }
    return output;
  },
  verifyForgotPasswordOTP: async (
    email: string,
    otp: string,
    newPassword: string,
  ) => {
    try {
      if (!email || !otp || !newPassword) {
        return {
          error: true,
          message: "Email, OTP, and new password are required.",
          data: null,
        };
      }
      const uri = `${baseUrl}/auth/reset-password`;

      const body = {
        email: email,
        otp: otp,
        newPassword: newPassword,
      };

      const response = await api.post(uri, body);
      if (response && response.status === 200) {
        return {
          error: false,
          message: response.data.message,
          data: response.data,
        };
      } else {
        return {
          error: true,
          message: "Failed to verify OTP. Please try again later.",
          data: null,
        };
      }
    } catch (error) {
      return {
        error: true,
        message: "Failed to verify OTP. Please try again later.",
        data: null,
      };
    }
  },
};

export default userSerivice;
