"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/app/components/ui/input-otp";

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
});

type OtpChallengeFormData = z.infer<typeof otpSchema>;

interface OtpChallengeFormProps {
  title?: string;
  message?: string;
  isLoading?: boolean;
  apiError?: string;
  onSubmit: (otp: string) => Promise<void> | void;
  onBack?: () => void;
}

const OtpChallengeForm: React.FC<OtpChallengeFormProps> = ({
  title = "Verify OTP",
  message = "Enter the OTP sent by Cognito to continue.",
  isLoading = false,
  apiError = "",
  onSubmit,
  onBack,
}) => {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<OtpChallengeFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const otpValue = watch("otp") || "";

  const handleFormSubmit = async (data: OtpChallengeFormData) => {
    await onSubmit(data.otp);
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
      <h1 className="text-slate-900 text-center text-2xl font-sans">{title}</h1>
      <p className="text-slate-600 text-center text-sm font-sans mt-3">
        {message}
      </p>

      {apiError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
          {apiError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="mt-10 space-y-6"
      >
        <div className="flex flex-col items-center">
          <label className="text-slate-900 text-sm font-medium mb-4 block">
            One-Time Password
          </label>
          <InputOTP
            maxLength={6}
            value={otpValue}
            onChange={(value) =>
              setValue("otp", value, { shouldValidate: true })
            }
            containerClassName="justify-center"
            pattern="\d*"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          {errors.otp && (
            <p className="text-red-500 text-xs mt-3">{errors.otp.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-black hover:underline font-semibold"
            >
              Back
            </button>
          ) : (
            <div />
          )}
          <button
            type="submit"
            disabled={isLoading || otpValue.length !== 6}
            className="py-2 px-4 text-[18px] font-normal tracking-wide rounded-[24px] text-black bg-[#a3d8d7] hover:bg-[#a3d5d5] focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Verify OTP"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OtpChallengeForm;
