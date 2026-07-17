"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Switch } from "@/app/components/ui/switch";
import {
  AdminCredentialEnum,
  canAccessAmbassadorManagementPermission,
  canAccessUserManagementPermission,
} from "@/app/_types/admin-credential.enum";
import { Settings, Settings2, Trash2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { getImageUrl } from "@/lib/utils";
import { useAppSelector } from "@/app/lib/redox/hooks";
import LoadingScreen from "@/app/components/loadingScreen";
import { useUsers } from "@/app/lib/storeHooks/useUsers";
import {
  useAdminCredentials,
  useRootUserCredentials,
} from "@/app/lib/storeHooks/useAdminCredentials";
import api from "@/app/_services/api_service";
import { deleteUser, updateUser } from "@/app/helpers/user_helper";
import { UserSchema } from "@/app/_types/user.type";
import { useAuthStore } from "@/app/stores/authStore";
import Pagination from "@/app/components/pagination";
import { isUserIsAdminCheck } from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

const PAGE_LIMIT = 20;

export default function UsersPage() {
  const [openAdminPrefs, setOpenAdminPrefs] = useState<string | null>(null);
  // Store credentials per userId
  const [adminPrefsMap, setAdminPrefsMap] = useState<
    Record<string, Record<string, boolean>>
  >({});
  const { user } = useAuthStore();

  // Fetch credentials for the currently open admin popover
  const userIdKey = openAdminPrefs ?? "";
  const { credentials, loading: credsLoading } =
    useAdminCredentials(openAdminPrefs);

  const { credentials: RootuserCredentials } = useRootUserCredentials(
    user?._id,
  );

  const isAdmin = isUserIsAdminCheck(user);

  const hasAmasidorePermission = canAccessUserManagementPermission(
    isAdmin,
    RootuserCredentials,
    user?.role,
  );

  // Sync fetched credentials to local state for toggling
  useEffect(() => {
    if (openAdminPrefs && credentials) {
      setAdminPrefsMap((prev) => ({
        ...prev,
        [userIdKey]: credentials.reduce(
          (acc, cred) => {
            acc[cred.credential] = cred.enabled;
            return acc;
          },
          {} as Record<string, boolean>,
        ),
      }));
    }
  }, [openAdminPrefs, credentials, userIdKey]);

  const handleAdminPrefChange = async (
    userId: string | null | undefined,
    key: string,
    value: boolean,
  ) => {
    const safeUserId = userId ?? "";
    // Save previous state for rollback
    const prevPrefs = adminPrefsMap[safeUserId]
      ? { ...adminPrefsMap[safeUserId] }
      : {};
    setAdminPrefsMap((prev) => ({
      ...prev,
      [safeUserId]: {
        ...(prev[safeUserId] || {}),
        [key]: value,
      },
    }));

    // Only allow API update if logged-in user is super_admin
    if (dbUser?.role === "super_admin") {
      // Prepare enabled credentials array
      const enabledCredentials = Object.entries({
        ...(adminPrefsMap[safeUserId] || {}),
        [key]: value,
      })
        .filter(([_, v]) => v)
        .map(([k]) => k);

      try {
        await api.post(`/v1/admin-credentials`, {
          user_id: safeUserId,
          type: enabledCredentials,
        });
      } catch (err) {
        // Rollback to previous state and close popover
        setAdminPrefsMap((prev) => ({
          ...prev,
          [safeUserId]: prevPrefs,
        }));
        setOpenAdminPrefs(null);
      }
    }
  };
  const [pageNumber, setPageNumber] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const {
    users,
    fetchUsers,
    loading,
    setUsers,
    total,
    totalPages,
    pageCurrent,
    count,
  } = useUsers();
  const { user: dbUser } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers(pageNumber, PAGE_LIMIT, searchQuery || "", selectedRole || "");
  }, [pageNumber, searchQuery, selectedRole]);

  useEffect(() => {
    setPageNumber(1);
  }, [searchQuery, selectedRole]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedRole("");
    setPageNumber(1);
  };

  const showClearFilters = Boolean(searchQuery.trim() || selectedRole);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

  const updateUserrole = async (user: UserSchema, newRole: string) => {
    const updatedUserObj: UserSchema = { ...user, role: newRole as any };
    const response = await updateUser(updatedUserObj as UserSchema);
    if (response) {
      const updatedUsers = users.map((u) =>
        u._id === user._id ? { ...u, role: newRole } : u,
      );
      setUsers(updatedUsers as UserSchema[]);
    }
  };

  const handlePageChange = (page: number) => {
    setPageNumber(page);
  };

  const handleDeleteTestUser = async (targetUser: UserSchema) => {
    if (!targetUser._id) return;

    setDeletingUserId(targetUser._id);
    const response = await deleteUser(targetUser._id);
    setDeletingUserId(null);

    if (!response) {
      toast({
        variant: "destructive",
        title: "Failed to delete test user",
      });
      return;
    }

    toast({
      title: "Test user deleted",
      description: response.message || `${targetUser.email} was deleted.`,
    });
    await fetchUsers(
      pageNumber,
      PAGE_LIMIT,
      searchQuery || "",
      selectedRole || "",
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden py-4 md:py-6">
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <button
            disabled
            type="button"
            className="py-2.5 px-5 me-2 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700 inline-flex items-center"
          >
            <svg
              aria-hidden="true"
              role="status"
              className="inline w-4 h-4 me-3 text-gray-200 animate-spin dark:text-gray-600"
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
                fill="#1C64F2"
              />
            </svg>
            Loading...
          </button>
        </div>
      ) : (
        <React.Fragment>
          <div className="flex items-center justify-between mb-6 px-4 md:px-6">
            <h1 className="text-3xl font-bold tracking-tight">
              User Management
            </h1>
          </div>

          <div className="w-full px-4 md:px-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>User Overview</CardTitle>
                <CardDescription>
                  Manage users and their permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <Overview title="Total Users" count={count || 0} />
                  <Overview title="Active Users" count={count || 0} />
                  <Overview
                    title="Administrators"
                    count={users?.filter((u) => u.role === "admin").length}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="px-4 md:px-6">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={selectedRole || "all"}
                onValueChange={(value) =>
                  setSelectedRole(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  {/* <SelectItem value="ca">CA</SelectItem> */}
                </SelectContent>
              </Select>
              {showClearFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-col flex-1 overflow-x-hidden overflow-y-auto px-4 md:px-6">
            <div className="rounded-md border flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Email
                    </TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 items-center flex justify-center ">
                            {u.picture && (
                              <div className="">
                                <Image
                                  src={getImageUrl(u.picture || "")}
                                  loading="eager"
                                  alt="Profile"
                                  width={48}
                                  height={48}
                                  unoptimized
                                />
                              </div>
                            )}
                            {!u?.picture && (
                              <div className="">
                                {getInitials(u.name || u.email || "U")}
                              </div>
                            )}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              disabled={!hasAmasidorePermission}
                              asChild
                            >
                              <Button
                                disabled={!hasAmasidorePermission}
                                className="bg-transparent hover:bg-transparent capitalize"
                              >
                                <Badge
                                  variant={
                                    u.role === "super_admin"
                                      ? "success"
                                      : u.role === "admin"
                                        ? "secondary"
                                        : "default"
                                  }
                                >
                                  {(u.role || "user")
                                    .split("_")
                                    .map(
                                      (w) =>
                                        w.charAt(0).toUpperCase() + w.slice(1),
                                    )
                                    .join(" ")}{" "}
                                  <ChevronDown className="ml-1" size={16} />
                                </Badge>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Status</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {["super_admin", "admin", "user"].map((role) => {
                                const roleDisplayMap: Record<string, string> = {
                                  admin: "Admin",
                                  user: "User",
                                  ca: "CA",
                                  super_admin: "Super Admin",
                                };
                                return (
                                  <DropdownMenuItem
                                    key={role}
                                    onClick={() => updateUserrole(u, role)}
                                  >
                                    <span className="capitalize">
                                      {roleDisplayMap[role] || role}
                                    </span>
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {u.role === "admin" && (
                            <Popover
                              open={openAdminPrefs === u._id}
                              onOpenChange={(open) =>
                                setOpenAdminPrefs(open ? (u._id ?? null) : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="rounded-full border border-slate-200 bg-white shadow-sm p-0"
                                  title="Admin Preferences"
                                >
                                  <Settings size={16} />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-72 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
                                <div className="font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-2">
                                  Admin Preferences
                                </div>
                                <div className="space-y-3 min-h-[80px]">
                                  {credsLoading ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                      <svg
                                        className="animate-spin h-5 w-5 text-slate-400"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                      >
                                        <circle
                                          className="opacity-25"
                                          cx="12"
                                          cy="12"
                                          r="10"
                                          stroke="currentColor"
                                          strokeWidth="4"
                                        ></circle>
                                        <path
                                          className="opacity-75"
                                          fill="currentColor"
                                          d="M4 12a8 8 0 018-8v8z"
                                        ></path>
                                      </svg>
                                      <span>Loading...</span>
                                    </div>
                                  ) : (
                                    AdminCredentialEnum.options.map((key) => (
                                      <div
                                        key={key}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2"
                                      >
                                        <span className="text-sm text-slate-700 capitalize">
                                          {key.replace(/_/g, " ")}
                                        </span>
                                        <Switch
                                          checked={
                                            !!adminPrefsMap[u._id ?? ""]?.[key]
                                          }
                                          onCheckedChange={(val) =>
                                            handleAdminPrefChange(
                                              u._id,
                                              key,
                                              val,
                                            )
                                          }
                                          disabled={!hasAmasidorePermission}
                                        />
                                      </div>
                                    ))
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Active</Badge>
                          {u.isTestUser && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8"
                                  title="Delete test user"
                                  disabled={deletingUserId === u._id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">
                                    Delete test user
                                  </span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete test user?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This deletes {u.email} from Cognito and the
                                    database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteTestUser(u)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className=" px-4 md:px-6 ">
            <Pagination
              currentPage={pageCurrent}
              totalPages={totalPages}
              onPageChange={(page) => handlePageChange(page)}
              limitNum={PAGE_LIMIT}
              totalItems={total || 0}
            />
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

const Overview = ({ title, count }: { title: string; count: number }) => (
  <div className="space-y-2">
    <p className="text-sm font-medium text-muted-foreground">{title}</p>
    <p className="text-3xl font-bold">{count}</p>
  </div>
);
