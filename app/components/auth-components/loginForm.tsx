"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import cognitoService, {
  CognitoAuthResponse,
} from "@/app/_services/aws-cognito.service";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import userSerivice from "@/app/_services/user.service";
import { updateBadges } from "@/lib/utils";
import OtpChallengeForm from "./otpChallengeForm";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onForgotPassword?: () => void;
  onRegister?: () => void;
  onSuccess?: (userData: any) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  onForgotPassword,
  onRegister,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [otpChallenge, setOtpChallenge] = useState<CognitoAuthResponse | null>(
    null,
  );
  const toster = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError("");

    try {
      const checkUser = await userSerivice.accountAccessCheck(data.username);
      if (checkUser.error) {
        throw checkUser;
      }

      const response = await cognitoService.login(data.username, data.password);

      if (response.status === "SUCCESS") {
        toster.toast({
          title: "Login successful!",
          variant: "default",
        });
        onSuccess?.(true);
        reset();
        updateBadges();
      } else {
        setOtpChallenge(response);
      }
    } catch (error: any) {
      setApiError(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (otp: string) => {
    setIsLoading(true);
    setApiError("");

    try {
      const response = await cognitoService.confirmLoginOtp(otp);

      if (response.status === "SUCCESS") {
        toster.toast({
          title: "Login successful!",
          variant: "default",
        });
        setOtpChallenge(null);
        onSuccess?.(true);
        reset({
          username: "",
          password: "",
        });
        updateBadges();
        return;
      }

      setOtpChallenge(response);
    } catch (error: any) {
      setApiError(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (otpChallenge?.status === "OTP_REQUIRED") {
    return (
      <OtpChallengeForm
        title="Enter OTP"
        message={otpChallenge.challengeMessage}
        apiError={apiError}
        isLoading={isLoading}
        onSubmit={handleOtpSubmit}
        onBack={() => {
          setOtpChallenge(null);
          setApiError("");
          const currentValues = getValues();
          reset(currentValues);
        }}
      />
    );
  }

  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-200 shadow-sm w-[480px]">
      <div className="w-[70px] h-[70px] rounded-full mx-auto border border-gray-200 mb-3 overflow-hidden flex items-center justify-center">
        <Image
          src={require("@/assets/app_logo_black.svg")}
          width={100}
          height={120}
          className="!w-auto !h-full object-contain"
          alt="Logo"
          loading="eager"
        />
      </div>
      <h1 className="text-slate-900 text-center text-2xl font-sans">Sign in</h1>
      <p className="text-slate-900 text-center text-sm font-sans mt-3">
        {"Don’t have an account yet? "}
        <button
          type="button"
          onClick={onRegister}
          className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
        >
          Sign up here
        </button>
      </p>
      {apiError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-10 space-y-6">
        <div>
          <label className="text-slate-900 text-sm font-medium mb-2 block">
            User name
          </label>
          <div className="relative flex items-center">
            <input
              {...register("username")}
              type="text"
              className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-full outline-blue-600 ${
                errors.username ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Enter user name"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#bbb"
              stroke="#bbb"
              className="w-4 h-4 absolute right-4"
              viewBox="0 0 24 24"
            >
              <circle cx="10" cy="7" r="6" data-original="#000000"></circle>
              <path
                d="M14 15H6a5 5 0 0 0-5 5 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 5 5 0 0 0-5-5zm8-4h-2.59l.3-.29a1 1 0 0 0-1.42-1.42l-2 2a1 1 0 0 0 0 1.42l2 2a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42l-.3-.29H22a1 1 0 0 0 0-2z"
                data-original="#000000"
              ></path>
            </svg>
          </div>
          {errors.username && (
            <p className="text-red-500 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-slate-900 text-sm font-medium mb-2 block">
            Password
          </label>
          <div className="relative flex items-center">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-full outline-blue-600 ${
                errors.password ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Enter password"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#bbb"
              stroke="#bbb"
              className="w-4 h-4 absolute right-4 cursor-pointer"
              viewBox="0 0 128 128"
              onClick={() => setShowPassword(!showPassword)}
            >
              <path
                d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z"
                data-original="#000000"
              ></path>
            </svg>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        <div className="flex items-center flex-row justify-between">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="text-sm">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-black hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>
          </div>

          <div className="">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-[18px] font-normal tracking-wide rounded-[24px] text-black bg-[#a3d8d7] hover:bg-#a3d5d5 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
