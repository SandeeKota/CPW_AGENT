"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authApi } from "@/app/lib/api/auth.api";
import cognitoService, {
  CognitoAuthResponse,
} from "@/app/_services/aws-cognito.service";
import Image from "next/image";
import { PasswordChecklist } from "../PasswordChecklist";
import { useToast } from "@/hooks/use-toast";
import { passwordRules } from "@/app/stores/authStore";
import OtpChallengeForm from "./otpChallengeForm";

// Validation schema
const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegistrationFormProps {
  onBackToLogin?: () => void;
  onSuccess?: (userData: any) => void;
  onForgotPassword?: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onBackToLogin,
  onSuccess,
  onForgotPassword,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Check if password is valid (all rules passed)
  const isPasswordValid = useMemo(() => {
    const password = watch("password") || "";
    return passwordRules.every((rule) => rule.test(password) || "");
  }, [watch("password")]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError("");

    try {
      const { confirmPassword, ...registerData } = data;
      const response: any = await authApi.register(registerData);
      if (response) {
        const loginResponse = await cognitoService.login(
          data.email,
          data.password,
        );

        if (loginResponse.status === "SUCCESS") {
          toster.toast({
            title: "Registration successful!",
            description: "",
            variant: "default",
          });
          onSuccess?.(true);
          reset();
        } else {
          setOtpChallenge(loginResponse);
        }
      } else {
        toster.toast({
          title: "Registration failed!",
          description: "Please try again.",
          variant: "destructive",
        });
        setApiError(response.message || "Registration failed");
      }
    } catch (error: any) {
      setApiError(error.message || "An error occurred during registration");
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
          title: "Registration successful!",
          description: "",
          variant: "default",
        });
        setOtpChallenge(null);
        onSuccess?.(true);
        reset();
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
        title="Verify Your Account"
        message={otpChallenge.challengeMessage}
        apiError={apiError}
        isLoading={isLoading}
        onSubmit={handleOtpSubmit}
        onBack={() => {
          setOtpChallenge(null);
          setApiError("");
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
      <h1 className="text-slate-900 text-center text-2xl font-sans">
        Create Account
      </h1>
      <p className="text-slate-900 text-sm !mt-3 text-center">
        Already have one?{" "}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
        >
          Sign in
        </button>
      </p>
      {apiError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-6">
        <div>
          <label className="text-slate-900 text-sm font-medium mb-2 block">
            Full Name
          </label>
          <div className="relative flex items-center">
            <input
              {...register("name")}
              type="text"
              className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-full outline-blue-600 ${
                errors.name ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Enter your full name"
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
          {errors.name && (
            <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="text-slate-900 text-sm font-medium mb-2 block">
            Email Address
          </label>
          <div className="relative flex items-center">
            <input
              {...register("email")}
              type="email"
              className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-full outline-blue-600 ${
                errors.email ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Enter your email address"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#bbb"
              stroke="#bbb"
              className="w-4 h-4 absolute right-4"
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
          <div className="">
            {!isPasswordValid && watch("password") && (
              <PasswordChecklist password={watch("password") || ""} />
            )}
          </div>

          {errors.password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label className="text-slate-900 text-sm font-medium mb-2 block">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              {...register("confirmPassword")}
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-full outline-blue-600 ${
                errors.confirmPassword ? "border-red-500" : "border-slate-300"
              }`}
              placeholder="Confirm your password"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#bbb"
              stroke="#bbb"
              className="w-4 h-4 absolute right-4 cursor-pointer"
              viewBox="0 0 128 128"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <path
                d="M64 104C22.127 104 1.367 67.496.504 65.943a4 4 0 0 1 0-3.887C1.367 60.504 22.127 24 64 24s62.633 36.504 63.496 38.057a4 4 0 0 1 0 3.887C126.633 67.496 105.873 104 64 104zM8.707 63.994C13.465 71.205 32.146 96 64 96c31.955 0 50.553-24.775 55.293-31.994C114.535 56.795 95.854 32 64 32 32.045 32 13.447 56.775 8.707 63.994zM64 88c-13.234 0-24-10.766-24-24s10.766-24 24-24 24 10.766 24 24-10.766 24-24 24zm0-40c-8.822 0-16 7.178-16 16s7.178 16 16 16 16-7.178 16-16-7.178-16-16-16z"
                data-original="#000000"
              ></path>
            </svg>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-black hover:underline font-semibold"
            >
              Forgot password?
            </button>
          </div>
          <div className="">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-[18px] font-normal tracking-wide rounded-3xl text-black bg-[#a3d8d7] hover:bg-[#a3d5d5] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
