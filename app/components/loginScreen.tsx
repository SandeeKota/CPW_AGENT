"use client";

import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import cognitoService from "../_services/aws-cognito.service";
import LoginForm from "./auth-components/loginForm";

export default function LoginScreen() {
  const isLoading = false; // TODO: Implement loading state
  const router = useRouter();
  useEffect(() => {
    const token = async () => {
      const tokenValue = await cognitoService.getSession();
      console.log(tokenValue);
    };
    token();
    return () => {};
  }, []);

  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {isLoading && (
        <div className="w-screen h-screen fixed top-0 left-0 inset-0 z-50 bg-white flex flex-col items-center justify-center">
          <div className="flex flex-row items-center p-3 shadow-md border border-gray-100 shadow-black/25 rounded-md  gap-3 ">
            <div role="status">
              <svg
                aria-hidden="true"
                className="w-5 h-5 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentFill"
                />
              </svg>
              <span className="sr-only">Loading...</span>
            </div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      )}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary"></div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          {/* <BarChart3 className="mr-2 h-6 w-6" /> */}
          Community for Water
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &quot;This platform has revolutionized how we manage our
              fundraising campaigns. It&apos;s intuitive, powerful, and helps us
              reach more donors than ever before.&quot;
            </p>
            <footer className="text-sm">Sofia Davis, Nonprofit Director</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center  ">
        <div className="gap-10 flex  flex-col justify-center items-center lg:!items-start ">
          <div className="flex flex-row items-center">
            {/* <BarChart3 className="mr-2 h-6 w-6 " /> */}
            <h1 className="text-2xl font-semibold tracking-tight  ">
              Community for Water
            </h1>
          </div>
          <div className=" flex flex-row items-center ">
            <LoginForm />
          </div>
          <p className="text-sm font-normal tracking-tight text-center lg:!text-left ">
            💧 &quot;Every drop counts. Every donation changes lives. Join us in
            bringing clean, safe water to those in need. Together, we can make a
            difference!&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
