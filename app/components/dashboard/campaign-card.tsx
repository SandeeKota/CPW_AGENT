import { Card } from "@/app/components/ui/card";
import { Progress } from "@/app/components/ui/progress";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Edit, Eye, Trash2, Calendar } from "lucide-react";
import Link from "next/link";
import { FundraiserSchema } from "@/app/_types/fundraiser.types";
import { useAppDispatch } from "@/app/lib/redox/hooks";
import { addFundraiserToUpdate } from "@/app/lib/redox/slices/fundraiser.slice";
import { useRouter } from "next/navigation";
import config from "@/app/config/config";
import ConfirmModal from "../ConfirmModal";
import api from "@/app/_services/api_service";
import { useSnackbar } from "../SnackbarContext";
import Image from "next/image";
import { differenceInCalendarDays, format } from "date-fns";

interface CampaignCardProps {
  campaign: FundraiserSchema;
  isAdmin?: boolean;
  viewButton?: boolean;
  onEdit?: (data: FundraiserSchema) => void;
  onDelete?: (id: string) => void;
}

export function CampaignCard({
  campaign,
  isAdmin = false,
  viewButton = false,
  onEdit,
  onDelete,
}: CampaignCardProps) {
  const dispath = useAppDispatch();
  const router = useRouter();
  const progress = Math.min(
    100,
    Math.floor(((campaign?.raised || 0) / (campaign?.goal || 1)) * 100),
  );
  const snackbar = useSnackbar();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: campaign?.currency_type?.toUpperCase() || "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formattedGoal = formatCurrency(campaign.goal || 0);
  const formattedRaised = formatCurrency(campaign.raised || 0);

  const endDateLabel = campaign.endDate
    ? (() => {
        try {
          return format(new Date(campaign.endDate), "dd MMM yyyy");
        } catch {
          return campaign.endDate;
        }
      })()
    : null;

  const daysLeft = campaign.endDate
    ? (() => {
        try {
          return differenceInCalendarDays(
            new Date(campaign.endDate),
            new Date(),
          );
        } catch {
          return null;
        }
      })()
    : null;

  const daysLeftLabel =
    daysLeft === null
      ? null
      : daysLeft < 0
        ? "Ended"
        : daysLeft === 0
          ? "Ends today"
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;

  const handledelete = async (choice: string) => {
    if (choice === "yes") {
      try {
        const res = await api.delete(`/v1/fundraisers/${campaign._id}`);
        if (res?.status === 200 && res?.data) {
          if (onDelete) {
            onDelete(campaign._id || "");
          }
          snackbar.show("Fundraiser deleted successfully", {
            type: "success",
            duration: 3000,
          });
        } else {
          snackbar.show("Failed to deleted Fundraiser", {
            type: "danger",
            duration: 3000,
          });
        }
      } catch (error) {
        snackbar.show(
          `${error instanceof Error ? error.message : "Failed to deleted Fundraiser"}`,
          {
            type: "danger",
            duration: 3000,
          },
        );
      }
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-[0_14px_34px_-26px_rgba(2,6,23,0.7)] hover:shadow-[0_20px_44px_-24px_rgba(2,6,23,0.7)] transition-all duration-200 p-0 bg-white">
      {/* Image */}
      <div className="relative h-44 bg-slate-100">
        {campaign?.bannerImage ? (
          <Image
            src={campaign.bannerImage}
            alt={campaign.title || "Campaign"}
            fill
            className="object-cover"
            loading="eager"
            priority={true}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
            No image
          </div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <Badge
            variant={
              campaign.status === "active"
                ? "default"
                : campaign.status === "completed"
                  ? "success"
                  : "destructive"
            }
            className="capitalize text-[11px] px-2 py-0.5 shadow-sm"
          >
            {campaign.status || "Active"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title & end date */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight line-clamp-1 text-slate-900">
            {campaign.title || "Untitled Campaign"}
          </h3>
          {endDateLabel && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              Ends {endDateLabel}
              {daysLeftLabel && (
                <span className="font-medium">({daysLeftLabel})</span>
              )}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">{formattedRaised}</span>
            <span className="text-xs text-muted-foreground">
              of {formattedGoal}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress}% funded</span>
            {campaign?.donors?.length ? (
              <span>
                {campaign.donors.length}{" "}
                {campaign.donors.length === 1 ? "donor" : "donors"}
              </span>
            ) : null}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs bg-slate-900 hover:bg-slate-800"
            asChild
          >
            <Link
              target="_blank"
              href={`${config.WEBSITE_URL}/fundraisers/${campaign._id}`}
              className="flex items-center justify-center gap-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              View
            </Link>
          </Button>

          {viewButton && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                dispath(addFundraiserToUpdate(campaign));
                router?.push(
                  `/dashboard/create-fundraise?type=update&id=${campaign._id}`,
                );
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}

          {viewButton && !campaign?.raised && (
            <ConfirmModal
              title="Are you sure you want to delete this fundraiser?"
              message="Please note: Once deleted, it cannot be undone."
              yesLabel="Delete"
              noLabel="Cancel"
              onSelect={(choice) => handledelete(choice)}
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </ConfirmModal>
          )}
        </div>
      </div>
    </Card>
  );
}
