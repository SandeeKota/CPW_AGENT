"use client";
import api from "@/app/_services/api_service";
import { UserBadgesVerix } from "@/app/_types/dination.type";
import LoadingScreen from "@/app/components/loadingScreen";
import { useAuthStore } from "@/app/stores/authStore";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { coverFormatedCurrency } from "@/lib/convertToSubcurrency";
import { updateBadges } from "@/lib/utils";
import { getAllMyVerixLinks, handleBulkDownload } from "@/app/utils/fileSevice";
import { Button } from "@/app/components/ui/button";
import { Download } from "lucide-react";
import { s } from "framer-motion/client";

const MyBadges = () => {
  const { user, isLoading } = useAuthStore();
  const isAdmin =
    user?.role === "admin" ||
    (user?.role === "super_admin" && user?.isAdminMode === true);
  const [loading, setIsLoading] = useState<boolean>(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [exportLoading, setExportLoading] = useState<boolean>(false);

  useEffect(() => {
    getBadges();
    updateBadges();
  }, []);

  const getBadges = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/v1/badges");
      setIsLoading(false);
      if (
        response &&
        response?.status === 200 &&
        response?.data &&
        response?.data?.data
      ) {
        const responseData = response?.data?.data;
        let badgesList: any[] = [];
        if (
          responseData &&
          responseData?.fundraisers &&
          responseData?.fundraisers?.length > 0
        ) {
          badgesList = [...badgesList, ...responseData?.fundraisers];
        }
        if (
          responseData &&
          responseData?.donations &&
          responseData?.donations?.length > 0
        ) {
          badgesList = [...badgesList, ...responseData?.donations];
        }

        // Only include badges with verixImageUrl or dbImageUrl
        const filteredBadges = (badgesList || []).filter(
          (badge) => badge?.verixImageUrl || badge?.dbImageUrl,
        );
        setBadges(filteredBadges);
      } else {
        setBadges([]);
      }
    } catch (error) {
      setIsLoading(false);
      setBadges([]);
    }
  };
  const [isbadgesNotFound, setIsBadgesNotFound] = useState<boolean>(false);

  const displaybadgesNotFound = () => {
    if (badges && badges?.length > 0) {
      setIsBadgesNotFound(false);
    } else {
      setIsBadgesNotFound(true);
    }

    setTimeout(() => {
      setIsBadgesNotFound(false);
    }, 5000);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const verixLinks = await getAllMyVerixLinks();
      setExportLoading(false);
      console.log("verixLinks: ", verixLinks);
      if (verixLinks && Array.isArray(verixLinks) && verixLinks?.length > 0) {
        await handleBulkDownload(
          verixLinks as any,
          ".png",
          "digital_certificates",
        );
        setExportLoading(false);
      } else {
        setExportLoading(false);
        displaybadgesNotFound();
      }
    } catch (error) {
      setExportLoading(false);
      displaybadgesNotFound();
    }
  };

  if (isAdmin) {
    <div className="w-full h-full flex justify-center items-center">
      <p>You are not authorized to view this page</p>
    </div>;
  }

  return (
    <React.Fragment>
      {loading && <LoadingScreen inside={true} />}

      <div className="w-full h-full overflow-hidden flex flex-col py-4 md:py-6">
        <div className="flex items-center justify-between mb-6 px-4 md:px-6">
          <h1 className="text-3xl font-bold tracking-tight">My Badges</h1>
          <Button variant={"outline"} onClick={handleExport}>
            {exportLoading && (
              <div className=" mx-2 flex items-center justify-center">
                <div className="h-4 w-4 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
              </div>
            )}
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
        {isbadgesNotFound && (
          <span className="text-red-700 -mt-5 px-6 ml-auto ">
            badges not found.
          </span>
        )}
        <div className="flex-1 overflow-auto p-4">
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {badges &&
              badges.length > 0 &&
              badges.map((badge: any, index: number) => {
                return (
                  <React.Fragment key={index}>
                    {(badge?.verixImageUrl || badge?.dbImageUrl) && (
                      <div className="w-full min-w-0 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="aspect-[4/3] w-full overflow-hidden rounded-t-lg">
                          <Image
                            src={badge?.dbImageUrl || badge?.verixImageUrl}
                            alt="badges"
                            width={400}
                            height={300}
                            className="object-cover w-full h-full"
                            loading="eager"
                          />
                        </div>

                        <div className="p-3 md:p-4 space-y-2">
                          {badge?.group_id && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs md:text-sm font-semibold text-gray-700 min-w-[60px]">
                                Badge ID:
                              </span>
                              <span className="text-xs md:text-sm text-gray-600 break-all">
                                {badge?.group_id}
                              </span>
                            </div>
                          )}

                          {badge?.group_title && (
                            <div className="flex items-start gap-2">
                              <span className="text-xs md:text-sm font-semibold text-gray-700 min-w-[60px]">
                                Title:
                              </span>
                              <span className="text-xs md:text-sm text-gray-600 break-all">
                                {badge?.group_title?.split(":")?.[1]?.trim() ||
                                  badge?.group_title}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
          </div>

          {(!badges || badges.length <= 0) && (
            <div className="w-full h-64 flex items-center justify-center">
              <p className="text-gray-500 text-lg">
                You haven't earned any badges yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

export default MyBadges;
// export interface UserBardgesVerix {
//     user_id?: string,
//     fundraiser?: {
//         id: string,
//         status: "created" | "completed",
//         verixImageUrl: string,
//         dbImageUrl: string,
//         group_id: string,
//         group_title: string,
//         fundraiser_createdAt?: string,
//         fundraiser_completedAt?: string
//     },
//     donation?: {
//         id: string,
//         donationType: "monthly" | "oneTime",
//         verixImageUrl: string,
//         dbImageUrl: string,
//         group_id: string,
//         group_title: string,
//         amount: number,
//         currency_type: string,
//         donation_createdAt: string
//     },
//     createdAt: string
// }
