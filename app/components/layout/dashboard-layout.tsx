"use client";

import { useState } from "react";
import { Sidebar } from "@/app/components/layout/sidebar";
import { Header } from "@/app/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">
      {/* Sidebar — full height, left column */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right column: header + content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 flex flex-col overflow-hidden overflow-x-hidden bg-[#f9f8f5] ">
          {children}
        </main>
      </div>
    </div>
  );
}
