"use client";
import React, { useEffect } from "react";
import { Card } from "@/app/components/ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import Image from "next/image";
import { Button } from "../ui/button";
import { CheckCircle, Eye, MapPin, Trash2, Users } from "lucide-react";
import { ProjectModal } from "@/app/_types/project.types";
import { useRouter } from "next/navigation";
import ConfirmModal from "../ConfirmModal";
import api from "@/app/_services/api_service";
import { useSnackbar } from "../SnackbarContext";

interface PROJECT_CARD_TYPE {
  project: Partial<ProjectModal>;
  isAdmin?: boolean;
  hasCenterPermission?: boolean;
  onDelete?: (id: string) => void;
}
const ProjectCard: React.FC<PROJECT_CARD_TYPE> = ({
  project,
  isAdmin,
  hasCenterPermission = false,
  onDelete,
}) => {
  const progress = Math.min(
    100,
    Math.floor(
      ((project?.amountRaised || 0) / (project?.totalProjectCost || 1)) * 100,
    ),
  );
  const router = useRouter();
  const snackbar = useSnackbar();

  const [status, setStatus] = React.useState<string>(
    project.projectStatus || "active",
  );

  const canAddCenter = hasCenterPermission;

  useEffect(() => {
    setStatus(project.projectStatus || "active");
  }, [project]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: project?.curency_type || "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const formattedGoal = formatCurrency(project?.totalProjectCost || 0);
  const formattedRaised = formatCurrency(project?.amountRaised || 0);

  const displayName =
    project?.center_type === "village"
      ? project?.title || project?.address?.villageName
      : project?.schoolName;

  const locationText = [
    project?.address?.villageName,
    project?.address?.districtName,
    project?.address?.stateName,
  ]
    .filter(Boolean)
    .join(", ");

  const donorCount = project?.donors?.length || 0;

  const handledelete = async (choice: string) => {
    if (choice === "yes") {
      try {
        const res = await api.delete(`/v1/projects/${project._id || ""}`);
        if (res?.status === 200 && res?.data) {
          if (onDelete) {
            onDelete(project._id || "");
          }
          snackbar.show("Center deleted successfully", {
            type: "success",
            duration: 3000,
          });
        } else {
          snackbar.show("Failed to deleted Center", {
            type: "danger",
            duration: 3000,
          });
        }
      } catch (error) {
        snackbar.show(
          `${error instanceof Error ? error.message : "Failed to deleted Center"}`,
          {
            type: "danger",
            duration: 3000,
          },
        );
      }
    }
  };

  const markAsComplete = async () => {
    try {
      const res = await api.put(`/v1/projects/${project._id || ""}/status`, {
        status: "completed",
      });

      if (res?.status === 200 && res?.data) {
        setStatus("completed");
        snackbar.show("Center marked as complete", {
          type: "success",
          duration: 3000,
        });
        router.refresh();
      } else {
        snackbar.show("Failed to mark Center as complete", {
          type: "danger",
          duration: 3000,
        });
      }
    } catch (error) {
      snackbar.show(
        `${error instanceof Error ? error.message : "Failed to mark Center as complete"}`,
        {
          type: "danger",
          duration: 3000,
        },
      );
    }
  };

  return (
    <Card className="overflow-hidden border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-0">
      {/* Image */}
      <div className="relative h-44 bg-muted">
        {project?.bannerImageUrl ? (
          <Image
            src={project.bannerImageUrl}
            alt={displayName || "Center"}
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
            variant="default"
            className="capitalize text-[11px] px-2 py-0.5 shadow-sm"
          >
            {project?.center_type || "School"}
          </Badge>
          <Badge
            variant={
              status === "completed"
                ? "success"
                : status === "active"
                  ? "secondary"
                  : "destructive"
            }
            className="text-[11px] px-2 py-0.5 shadow-sm capitalize"
          >
            {status}
          </Badge>
        </div>

        {status !== "completed" && canAddCenter && (
          <button
            onClick={markAsComplete}
            className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm border border-border/50 px-2.5 py-1 text-[11px] font-medium shadow-sm hover:bg-white dark:hover:bg-black transition-colors cursor-pointer"
          >
            <CheckCircle className="h-3 w-3" />
            Mark as Complete
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Title & location */}
        <div className="space-y-1">
          <h3 className="font-semibold text-base leading-tight line-clamp-1">
            {displayName || "Untitled Center"}
          </h3>
          {locationText && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground line-clamp-1">
              <MapPin className="h-3 w-3 shrink-0" />
              {locationText}
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
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {donorCount} {donorCount === 1 ? "donor" : "donors"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-8 text-xs"
            onClick={() => router.push(`/dashboard/centers/${project._id}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View Details
          </Button>
          {canAddCenter && (
            <ConfirmModal
              title="Are you sure you want to delete this center?"
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
};

export default ProjectCard;
