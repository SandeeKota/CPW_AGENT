"use client";
import { Button } from "@/app/components/ui/button";
import { Menu } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  toggleSidebar: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 md:hidden flex h-16 items-center gap-3 bg-[#173945]  px-4 md:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Brand — mobile only (desktop shows sidebar logo) */}
      <div className="flex-1 flex items-center md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#227077] flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                fill="white"
              />
            </svg>
          </div>
          <span className="text-white font-semibold text-base">CPW</span>
        </Link>
      </div>

      <div className="flex-1 hidden md:block" />

      {/* Orange accent bar */}
      <div className="h-5 w-1 rounded-full bg-[#d46535]" />
    </header>
  );
}
