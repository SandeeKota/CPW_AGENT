"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  ValueGetterParams,
} from "ag-grid-community";
import { AlertCircle, RefreshCcw } from "lucide-react";
import LoadingScreen from "@/app/components/loadingScreen";
import Pagination from "@/app/components/pagination";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { useAuthStore } from "@/app/stores/authStore";
import {
  getNewsletterSubscribers,
  getNewsletterUnsubscribers,
  NewsletterSubscriber,
  unsubscribeEmail,
} from "@/app/_services/newsletter.service";
import { isUserIsAdminCheck } from "@/lib/constants";
import { canAccessNewsletterManagementPermission } from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";

ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_PAGE_SIZE = 20;
type SubscriptionFilter = "subscribed" | "Un-subscribed";

const resolveSubscribedStatus = (row: NewsletterSubscriber): boolean | null => {
  if (typeof row.subscribed === "boolean") return row.subscribed;
  if (typeof row.isSubscribed === "boolean") return row.isSubscribed;
  if (typeof row.status === "string") {
    const normalized = row.status.trim().toLowerCase();
    if (["subscribed", "active", "true", "yes", "1"].includes(normalized))
      return true;
    if (
      [
        "Un-subscribed",
        "unsubscribed",
        "inactive",
        "false",
        "no",
        "0",
      ].includes(normalized)
    )
      return false;
  }
  return null;
};

const SubscribersPage = () => {
  const { user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(user);

  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [subscriptionFilter, setSubscriptionFilter] =
    useState<SubscriptionFilter>("subscribed");
  const [pageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalSubscribers, setTotalSubscribers] = useState<number>(0);
  const [unsubscribeLoadingMap, setUnsubscribeLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [unsubscribeErrorMap, setUnsubscribeErrorMap] = useState<
    Record<string, string>
  >({});

  const { credentials } = useAdminCredentials(user?._id);
  const hasPermission = canAccessNewsletterManagementPermission(
    isAdmin,
    credentials,
    user?.role,
  );

  const columnDefs = useMemo<ColDef<NewsletterSubscriber>[]>(
    () => [
      {
        headerName: "#",
        maxWidth: 90,
        minWidth: 70,
        sortable: false,
        filter: false,
        valueGetter: (params: ValueGetterParams<NewsletterSubscriber>) =>
          (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
      },
      {
        field: "email",
        headerName: "Subscriber Email",
        flex: 1,
        minWidth: 280,
      },
      {
        headerName: "Actions",
        hide: subscriptionFilter === "Un-subscribed" || !hasPermission,
        maxWidth: 150,
        minWidth: 120,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const email = params.data.email;
          const isLoading = unsubscribeLoadingMap[email] || false;
          const error = unsubscribeErrorMap[email];

          // Only show button for subscribed tab
          if (subscriptionFilter !== "subscribed") {
            return null;
          }

          return (
            <div className="flex items-center gap-2 h-full">
              <button
                onClick={() => handleUnsubscribe(email)}
                disabled={isLoading}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  isLoading
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-red-500 text-white hover:bg-red-600"
                }`}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="animate-spin h-3 w-3"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                ) : (
                  "Unsubscribe"
                )}
              </button>
              {error && (
                <div className="text-xs text-red-600 truncate" title={error}>
                  {error}
                </div>
              )}
            </div>
          );
        },
      },
    ],
    [
      currentPage,
      pageSize,
      subscriptionFilter,
      unsubscribeLoadingMap,
      unsubscribeErrorMap,
      hasPermission,
    ],
  );

  const handleUnsubscribe = async (email: string) => {
    try {
      setUnsubscribeLoadingMap((prev) => ({ ...prev, [email]: true }));
      setUnsubscribeErrorMap((prev) => ({ ...prev, [email]: "" }));

      await unsubscribeEmail(email);

      // Remove the subscriber from the list after successful unsubscribe
      setSubscribers((prev) => prev.filter((sub) => sub.email !== email));
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to unsubscribe email.";
      setUnsubscribeErrorMap((prev) => ({ ...prev, [email]: errorMsg }));
    } finally {
      setUnsubscribeLoadingMap((prev) => ({ ...prev, [email]: false }));
    }
  };

  const loadSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      let response;
      if (subscriptionFilter === "subscribed") {
        response = await getNewsletterSubscribers(
          currentPage,
          pageSize,
          "",
          true,
        );
      } else {
        response = await getNewsletterUnsubscribers(currentPage, pageSize, "");
      }

      const responseRows = response.data || [];

      // Fallback for APIs that ignore the subscribed query param.
      const filteredRows = responseRows.filter((row) => {
        const status = resolveSubscribedStatus(row);
        if (status === null) return true;
        const expectedSubscribed = subscriptionFilter === "subscribed";
        return status === expectedSubscribed;
      });

      setSubscribers(filteredRows);
      setCurrentPage(response.pagination?.page || 1);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalSubscribers(
        filteredRows.length || response.pagination?.total || 0,
      );
    } catch (error: any) {
      setSubscribers([]);
      setTotalPages(1);
      setTotalSubscribers(0);
      setErrorMessage(error?.message || "Failed to load subscribers.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, subscriptionFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    loadSubscribers();
  }, [isAdmin, currentPage, pageSize, subscriptionFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [subscriptionFilter]);

  if (!isAdmin) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view newsletter subscribers.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
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
            <div className="flex items-center justify-between mb-6 gap-4 px-4 md:px-6 ">
              <div className="">
                <h1 className="text-3xl font-bold tracking-tight ">
                  Subscribers
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Newsletter subscriber emails collected from the site.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant={
                      subscriptionFilter === "subscribed"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setSubscriptionFilter("subscribed")}
                  >
                    Subscribed
                  </Button>
                  <Button
                    variant={
                      subscriptionFilter === "Un-subscribed"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => setSubscriptionFilter("Un-subscribed")}
                  >
                    Un-Subscribed
                  </Button>
                </div>
              </div>
              <Button onClick={loadSubscribers} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>

            {errorMessage ? (
              <div className="w-full px-4 md:px-6">
                <Card className="p-6 border-red-200 bg-red-50">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h2 className="font-semibold text-red-700">
                        Unable to load subscribers
                      </h2>
                      <p className="text-sm text-red-600 mt-1">
                        {errorMessage}
                      </p>
                      <Button className="mt-4" onClick={loadSubscribers}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            ) : subscribers.length > 0 ? (
              <div className="px-4 md:px-6 flex-1 flex flex-col overflow-hidden ">
                <div className="overflow-auto flex-1 max-w-[100%] border rounded-lg border-gray-200">
                  <AgGridReact<NewsletterSubscriber>
                    rowData={[...subscribers]}
                    columnDefs={columnDefs}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center px-4 md:px-6">
                <Card className="p-8 text-center max-w-md">
                  <h2 className="text-lg font-semibold">
                    No subscribers found
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    {subscriptionFilter === "subscribed"
                      ? "Newsletter subscriber emails will appear here when users subscribe."
                      : "Unsubscribed users will appear here when available."}
                  </p>
                </Card>
              </div>
            )}

            {!errorMessage && (
              <div className="px-4 md:px-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(value) => setCurrentPage(value)}
                  totalItems={totalSubscribers || 0}
                  limitNum={pageSize}
                />
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

export default SubscribersPage;
