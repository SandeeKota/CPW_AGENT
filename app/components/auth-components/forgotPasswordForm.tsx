"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import cognitoService from "@/app/_services/aws-cognito.service";
import Image from "next/image";
import { PasswordChecklist } from "../PasswordChecklist";
import { useToast } from "@/hooks/use-toast";
import { passwordRules } from "@/app/stores/authStore";
import userSerivice from "@/app/_services/user.service";

// Validation schemas
const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const otpSchema = z
  .object({
    otp: z
      .string()
      .min(6, "OTP must be 6 digits")
      .max(6, "OTP must be 6 digits"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      ),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
  onSuccess?: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onBackToLogin,
  onSuccess,
}) => {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toster = useToast();

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const isPasswordValid = useMemo(() => {
    const password = otpForm.watch("newPassword") || "";
    return passwordRules.every((rule) => rule.test(password) || "");
  }, [otpForm.watch("newPassword")]);

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const checkUser = await userSerivice.accountAccessCheck(data.email);
      if (checkUser.error) {
        throw checkUser;
      }

      const cognitoUser = await userSerivice.getCognitoUser(data.email);

      if (cognitoUser.error) throw cognitoUser;

      // const response: any = await cognitoService.forgotPassword(cognitoUser?.data?.Username || data.email);
      const response: any = await userSerivice.requestForgotPasswordOTP(
        data.email,
      );
      console.log("response api", response?.data?.error);

      if (!response?.data?.error) {
        setEmail(data.email);
        setStep("otp");
        setSuccessMessage(response.challengeMessage);
        startResendCooldown();
      } else {
        setApiError(response.message || "Failed to send OTP");
      }
    } catch (error: any) {
      setApiError(error.message || "An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setApiError("");

    try {
      const response: any = await userSerivice.verifyForgotPasswordOTP(
        email,
        data.otp,
        data.newPassword,
      );
      console.log("response", response);

      if (!response?.error) {
        setSuccessMessage(
          "Password reset successful! Please check your email for the new password.",
        );
        onSuccess?.();
        toster.toast({
          title: "Password reset successful!",
          description: "Please check your email for the new password.",
          variant: "default",
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onBackToLogin?.();
        }, 3000);
      } else {
        setApiError(response.message || "Invalid OTP");
        toster.toast({
          title: "Password reset failed!",
          description: "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setApiError(error.message || "An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await handleEmailSubmit({ email: emailForm.getValues("email") });
    // if (resendCooldown > 0) return;

    // setIsLoading(true);
    // setApiError("");

    // try {
    //   const response: any = await cognitoService.forgotPassword(email);

    //   if (response.challengeMessage || response.success || response.nextAction === "MFA_CHALLENGE" || response.challengeMessage === "OTP is sent to your registered email") {
    //     setSuccessMessage("OTP resent successfully");
    //     startResendCooldown();
    //   } else {
    //     setApiError(response.message || "Failed to resend OTP");
    //   }
    // } catch (error: any) {
    //   setApiError(error.message || "An error occurred while resending OTP");
    // } finally {
    //   setIsLoading(false);
    // }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBackToEmail = () => {
    setStep("email");
    setApiError("");
    setSuccessMessage("");
    otpForm.reset();
  };

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
        {step === "email" ? "Forgot password" : "Enter OTP"}
      </h1>

      {apiError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {apiError}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
          {successMessage}
        </div>
      )}

      {step === "email" ? (
        <form
          onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
          className="mt-12 space-y-6"
        >
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">
              Email Address
            </label>
            <div className="relative flex items-center">
              <input
                {...emailForm.register("email")}
                type="email"
                className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-md outline-blue-600 ${
                  emailForm.formState.errors.email
                    ? "border-red-500"
                    : "border-slate-300"
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
            {emailForm.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="!mt-12">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 text-[18px] font-normal tracking-wide rounded-[24px] text-black bg-[#a3d8d7] hover:bg-#a3d5d5 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>

          <p className="text-slate-900 text-sm !mt-6 text-start">
            Remember your password?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
            >
              Sign in
            </button>
          </p>
        </form>
      ) : (
        <form
          onSubmit={otpForm.handleSubmit(handleOtpSubmit)}
          className="mt-12 space-y-6"
        >
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">
              Enter OTP
            </label>
            <p className="text-slate-600 text-xs mb-4">
              We've sent a 6-digit OTP to {email}
            </p>
            <div className="relative flex items-center">
              <input
                {...otpForm.register("otp")}
                type="text"
                maxLength={6}
                className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-md outline-blue-600 tracking-widest ${
                  otpForm.formState.errors.otp
                    ? "border-red-500"
                    : "border-slate-300"
                }`}
                placeholder="000000"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="#bbb"
                stroke="#bbb"
                className="w-4 h-4 absolute right-4"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M10 17L6 13L7.41 11.59L10 14.17L16.59 7.58L18 9L10 17Z" />
              </svg>
            </div>
            {otpForm.formState.errors.otp && (
              <p className="text-red-500 text-xs mt-1">
                {otpForm.formState.errors.otp.message}
              </p>
            )}
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">
              New Password
            </label>
            <div className="relative flex items-center">
              <input
                {...otpForm.register("newPassword")}
                type={showPassword ? "text" : "password"}
                className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-md outline-blue-600 ${
                  otpForm.formState.errors.newPassword
                    ? "border-red-500"
                    : "border-slate-300"
                }`}
                placeholder="Enter your new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#bbb"
                  stroke="#bbb"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                >
                  {showPassword ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94L17.94 17.94zM1 1l22 22M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19l-6.72-6.72a3 3 0 0 0-4.24-4.24L9.9 4.24zM14.12 14.12a3 3 0 0 1-4.24-4.24l4.24 4.24z" />
                  ) : (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  )}
                </svg>
              </button>
            </div>
            <div className="">
              {!isPasswordValid && otpForm.getValues("newPassword") && (
                <PasswordChecklist
                  password={otpForm.getValues("newPassword") || ""}
                />
              )}
            </div>
            {otpForm.formState.errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">
                {otpForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <input
                {...otpForm.register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                className={`w-full text-slate-900 text-sm border px-4 py-3 pr-8 rounded-md outline-blue-600 ${
                  otpForm.formState.errors.confirmPassword
                    ? "border-red-500"
                    : "border-slate-300"
                }`}
                placeholder="Confirm your new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#bbb"
                  stroke="#bbb"
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                >
                  {showConfirmPassword ? (
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94L17.94 17.94zM1 1l22 22M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19l-6.72-6.72a3 3 0 0 0-4.24-4.24L9.9 4.24zM14.12 14.12a3 3 0 0 1-4.24-4.24l4.24 4.24z" />
                  ) : (
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  )}
                </svg>
              </button>
            </div>
            {otpForm.formState.errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">
                {otpForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleBackToEmail}
              className="text-blue-600 hover:underline text-sm font-medium"
            >
              ← Change Email
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || isLoading}
              className="text-blue-600 hover:underline text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend OTP"}
            </button>
          </div>

          <div className="!mt-12">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4  text-[18px] font-normal tracking-wide rounded-3xl text-black bg-[#a3d8d7] hover:bg-[#a3d5d5] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </div>

          <p className="text-slate-900 text-sm !mt-6 text-start">
            Remember your password?{" "}
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-blue-600 hover:underline ml-1 whitespace-nowrap font-semibold"
            >
              Sign in
            </button>
          </p>
        </form>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
