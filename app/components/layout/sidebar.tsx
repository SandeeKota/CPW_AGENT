"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, getImageUrl } from "@/lib/utils";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { isUserIsAdminCheck, SIDEBAR_LINKS } from "@/lib/constants";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuthStore, User } from "@/app/stores/authStore";
import { toggleUserToAdmin, updateUser } from "@/app/helpers/user_helper";
import { UserSchema } from "@/app/_types/user.type";
import LoadingScreen from "../loadingScreen";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Cog, LogOut, Settings, X } from "lucide-react";
import ConfirmModal from "@/app/components/ConfirmModal";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const getUserBadgeName = (role: string, isAdminMode: boolean = false) => {
  if (role === "super_admin") {
    return isAdminMode ? "Super Admin" : "User";
  }
  if (role === "admin") {
    return isAdminMode ? "Admin" : "User";
  }
  return "User";
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  // Get root credentials fetcher and state from main hook
  const {
    fetchRootUserCredentials,
    rootUserCredentials,
    rootLoading: rootUserCredentialsloading,
    rootError: rootUserCredentialsError,
  } = useAdminCredentials();

  // Find root user ID (super_admin) from userDb or fetch from API if needed
  const rootUserId = user ? user._id : undefined;

  useEffect(() => {
    // If you have a way to get the root user ID, use it here
    if (rootUserId) {
      fetchRootUserCredentials(rootUserId);
    }
  }, [rootUserId, fetchRootUserCredentials]);

  const [userDb, setUserDb] = useState<User | null>(user as User);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoding, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768);
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      // onClose();
    }
  }, [pathname, isMobile, onClose]);

  // Utility: Filter and sort routes based on role/mode
  const getFilteredLinks = useCallback(() => {
    return SIDEBAR_LINKS.filter((link) => {
      if (isAdmin) return !link.isUserOnly;
      return !link.adminOnly;
    }).sort((a, b) =>
      isAdmin ? a.adminOrder - b.adminOrder : a.userOrder - b.userOrder,
    );
  }, [isAdmin]);
  const filteredLinks = useMemo(() => getFilteredLinks(), [getFilteredLinks]);

  useEffect(() => {
    setUserDb(user);
    if (user) {
      setIsAdmin(isUserIsAdminCheck(user || false));
    }
  }, [user]);

  const handleToggle = async (e: boolean) => {
    const value: boolean = !e;
    setIsAdmin(isUserIsAdminCheck(value));
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const userObj: UserSchema = { ...userDb, isAdminMode: value } as UserSchema;
    const response = await toggleUserToAdmin(userObj);
    setIsLoading(false);
    if (response) {
      window.location.reload();
    } else {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
      });
    }
  };

  // Logout modal state and handler
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const handleLogoutMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowLogoutConfirm(true);
  };
  const handleLogoutConfirm = (choice: "yes" | "no") => {
    setShowLogoutConfirm(false);
    if (choice === "yes") {
      logout();
    }
  };

  return (
    <>
      {isLoding && <LoadingScreen inside={true} />}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          "bg-[#173945]",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo area */}
        <div className="flex h-16 items-center px-5 ">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => isMobile && onClose()}
          >
            <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 bg-white ">
              <Image
                src="/favicon.ico"
                alt="CPW logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-white font-semibold text-base tracking-wide">
              CPW Dashboard
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="grid gap-0.5 px-3">
            {filteredLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => isMobile && onClose()}
                  prefetch
                >
                  <div
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-[#227077] text-white shadow-sm"
                        : "text-white/70 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d46535] flex-shrink-0" />
                    )}
                    <span className={cn(!isActive && "ml-[14px]")}>
                      {isAdmin
                        ? `${link.adminTitle || ""}`
                        : `${link.userTitle || ""}`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className=" p-4 max-w-full overflow-hidden">
          {(user?.role === "super_admin" || user?.role === "admin") && (
            <React.Fragment>
              <div className="flex flex-row items-center justify-between mb-3">
                <Label htmlFor="user-mode" className="text-white/70 text-sm">
                  User Mode
                </Label>
                <Switch
                  id="user-mode"
                  checked={!isAdmin}
                  onCheckedChange={(e: boolean) => handleToggle(e)}
                  className="data-[state=checked]:bg-[#227077]"
                />
              </div>
              <div className="h-px bg-white/10 mb-3" />
            </React.Fragment>
          )}

          <div className="flex items-center justify-between max-w-full overflow-hidden">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-[#227077]/50">
                <AvatarImage
                  src={getImageUrl(user?.picture || "")}
                  alt="avatar"
                  className="object-cover"
                />
                <AvatarFallback className="bg-[#227077] text-white text-xs">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white font-medium truncate">
                  {user?.name}
                </p>
                {user?.role && (
                  <p className="text-xs text-[#d46535] truncate">
                    {getUserBadgeName(user?.role, user?.isAdminMode || false)}
                  </p>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  className="w-8 h-8 cursor-pointer rounded-md flex items-center justify-center
                 text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <Cog className="h-4 w-4" />
                  <span className="sr-only">User menu</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogoutMenuClick}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <>
          <div
            className="fixed top-0 left-0 inset-0 w-[dvw] h-[dvh] overflow-hidden bg-black/50 backdrop-blur-md z-[9999999999] 
          flex items-center justify-center
          "
          >
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-[500px]  w-full">
              <div className="w-full flex flex-row  justify-between">
                <h2 className="text-lg font-semibold mb-4 flex-1">
                  {"Confirm Logout"}
                </h2>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="hover:bg-gray-400 w-8 h-8 rounded-full flex items-center justify-center "
                >
                  <X size={25} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                {"Are you sure you want to log out?"}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 cursor-pointer "
                  onClick={() => handleLogoutConfirm("no")}
                >
                  {"Cancel"}
                </button>
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700
                  cursor-pointer
                  "
                  onClick={() => handleLogoutConfirm("yes")}
                >
                  {"Logout"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
