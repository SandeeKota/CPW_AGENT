import type { Metadata } from "next";
import { Signika_Negative } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { ReduxProvider } from "./lib/redox/provider";
import { Toaster } from "./components/ui/toaster";
import { SnackbarProvider } from "./components/SnackbarContext";
import VerifyingDonations from "./components/verifying-donations";
// import PostHogProvider from "./components/providers/posthog-provider";

const signikaNegative = Signika_Negative({
  subsets: ["latin"],
  variable: "--font-signika-negative",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Community for Water",
  description:
    "Community for Water Dashboard - your fundraising command center.",
  keywords:
    "clean water, RO water, donation, charity, schools, villages, water purification",
  openGraph: {
    images:
      "https://cpw-prod-app.s3.ap-south-1.amazonaws.com/project/project-banner/anonymous-home_banner-1756097938387.jpg",
  },
  applicationName: "Community for Water",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <body
        className={`${signikaNegative.className} ${signikaNegative.variable}`}
      >
        {/* <PostHogProvider> */}
          <SnackbarProvider>
            <ReduxProvider>
              <AuthProvider>
                {children}
                <Toaster />
              </AuthProvider>
            </ReduxProvider>
            <VerifyingDonations />
          </SnackbarProvider>
        {/* </PostHogProvider> */}
      </body>
    </html>
  );
}
