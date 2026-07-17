"use client";
import React, { useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "../redox/store";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import SuspenseWrapper from "@/app/components/providers/searchParamProviders";
import { loadRazorpay } from "@/app/utils/api/razorepay.util";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const store = useRef<AppStore>();
  if (!store.current) {
    store.current = makeStore();
  }
  const loadRazorepaySDK = async () => {
    const res = await loadRazorpay();
  };

  useEffect(() => {
    loadRazorepaySDK();
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Provider store={store.current}>
        <SuspenseWrapper>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
        </SuspenseWrapper>
      </Provider>
    </ThemeProvider>
  );
}
