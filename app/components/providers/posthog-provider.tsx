"use client";

import { ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import config from "@/app/config/config";

let initialized = false;

if (
  typeof window !== "undefined" &&
  !initialized &&
  config.postHug?.POSTHOG_KEY
) {
  posthog.init(config.postHug.POSTHOG_KEY, {
    api_host: config.postHug.POSTHOG_HOST,
    person_profiles: "identified_only",

    autocapture: true,
    capture_pageview: true,
    capture_pageleave: true,

    loaded: (client) => {
      if (process.env.NODE_ENV === "development") {
        client.debug();
      }
    },
  });

  initialized = true;
}

interface Props {
  children: ReactNode;
}

export default function AppPostHogProvider({ children }: Props) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
