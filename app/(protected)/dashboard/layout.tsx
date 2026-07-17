"use client";

import AppMain from "../../app";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppMain>{children}</AppMain>;
}
