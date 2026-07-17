"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  ValueGetterParams,
} from "ag-grid-community";
import {
  AlertCircle,
  Eye,
  Pencil,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { z } from "zod";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import LoadingScreen from "@/app/components/loadingScreen";
import Pagination from "@/app/components/pagination";
import { getAmbassadorById } from "@/app/_services/ambassador.service";
import {
  Ambassador,
  AmbassadorApplyInput,
  AmbassadorStatus,
  AmbassadorUpdateInput,
  ambassadorApplySchema,
  ambassadorUpdateSchema,
} from "@/app/_types/ambassador.type";
import { useAmbassadors } from "@/app/lib/storeHooks/useAmbassadors";
import { useAuthStore } from "@/app/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

ModuleRegistry.registerModules([AllCommunityModule]);

type FormMode = "create" | "edit";

type AmbassadorFormData = {
  full_name: string;
  email: string;
  organization: string;
  city: string;
  phone_number: string;
  contribution_preference: string;
  motivation: string;
  status: AmbassadorStatus;
};

const defaultFormData: AmbassadorFormData = {
  full_name: "",
  email: "",
  organization: "",
  city: "",
  phone_number: "",
  contribution_preference: "",
  motivation: "",
  status: "pending",
};

const getIdFromRow = (row: Ambassador): string => {
  if (!row?._id) return "";
  if (typeof row._id === "string") return row._id;
  if ((row._id as any)?.$oid) return String((row._id as any).$oid);
  if (typeof (row._id as any)?.toString === "function")
    return (row._id as any).toString();
  return String(row._id);
};

const getStatusClasses = (status?: AmbassadorStatus) => {
  if (status === "approved") return "bg-green-500 hover:bg-green-500";
  if (status === "rejected") return "bg-red-500 hover:bg-red-500";
  return "bg-yellow-500 hover:bg-yellow-500";
};

const mapAmbassadorToForm = (item?: Ambassador | null): AmbassadorFormData => {
  if (!item) return defaultFormData;

  return {
    full_name: item.full_name || "",
    email: item.email || "",
    organization: item.organization || "",
    city: item.city || "",
    phone_number: item.phone_number || "",
    contribution_preference: item.contribution_preference || "",
    motivation: item.motivation || "",
    status: item.status || "pending",
  };
};

const toOptionalString = (value: string): string | undefined => {
  return value.trim().length ? value.trim() : undefined;
};

const toCreatePayload = (
  formData: AmbassadorFormData,
): AmbassadorApplyInput => ({
  full_name: formData.full_name,
  email: formData.email,
  organization: toOptionalString(formData.organization),
  city: formData.city,
  country: formData.city,
  phone_number: formData.phone_number,
  contribution_preference: toOptionalString(formData.contribution_preference),
  motivation: formData.motivation,
});

const toUpdatePayload = (
  formData: AmbassadorFormData,
): AmbassadorUpdateInput => ({
  full_name: formData.full_name,
  email: formData.email,
  organization: toOptionalString(formData.organization),
  city: formData.city,
  phone_number: formData.phone_number,
  contribution_preference: toOptionalString(formData.contribution_preference),
  motivation: formData.motivation,
  status: formData.status,
});

const mapZodErrors = (error: z.ZodError): Record<string, string> => {
  const mapped: Record<string, string> = {};
  error.issues.forEach((issue) => {
    const key = issue.path.join(".");
    if (!mapped[key]) mapped[key] = issue.message;
  });
  return mapped;
};

const AmbassadorPage = () => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin =
    (user?.role === "admin" || user?.role === "super_admin") &&
    user?.isAdminMode;

  const {
    ambassadors,
    loading,
    submitting,
    deletingId,
    errorMessage,
    searchQuery,
    statusFilter,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setCurrentPage,
    onChangeSearch,
    onChangeStatus,
    fetchAmbassadors,
    createApplication,
    updateApplication,
    deleteApplication,
    setErrorMessage,
  } = useAmbassadors();

  const [formMode, setFormMode] = useState<FormMode>("create");
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(false);
  const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedAmbassador, setSelectedAmbassador] =
    useState<Ambassador | null>(null);
  const [candidateDelete, setCandidateDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [formData, setFormData] = useState<AmbassadorFormData>(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    router?.replace("/dashboard/inquiries");
  }, []);

  const handleQuickStatusUpdate = async (
    id: string,
    status: AmbassadorStatus,
  ) => {
    const success = await updateApplication(id, { status });
    if (success) {
      toast({
        title: "Status updated",
        description: `Application marked as ${status}.`,
      });
    } else {
      toast({
        title: "Update failed",
        description: "Unable to update application status.",
        variant: "destructive",
      });
    }
  };

  const columnDefs = useMemo<ColDef<Ambassador>[]>(
    () => [
      {
        headerName: "#",
        maxWidth: 90,
        minWidth: 70,
        sortable: false,
        filter: false,
        valueGetter: (params: ValueGetterParams<Ambassador>) =>
          (currentPage - 1) * pageSize + (params.node?.rowIndex ?? 0) + 1,
      },
      {
        field: "full_name",
        headerName: "Name",
        flex: 1,
        minWidth: 180,
      },
      {
        field: "email",
        headerName: "Email",
        flex: 1,
        minWidth: 220,
      },
      {
        field: "city",
        headerName: "City",
        minWidth: 140,
      },
      {
        field: "phone_number",
        headerName: "Phone",
        minWidth: 170,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 210,
        cellRenderer: (params: {
          data?: Ambassador;
          value?: AmbassadorStatus;
        }) => {
          const row = params.data;
          const id = row ? getIdFromRow(row) : "";
          const currentStatus = params.value || "pending";

          return (
            <div className="flex items-center gap-2">
              <Badge className={getStatusClasses(currentStatus)}>
                {currentStatus}
              </Badge>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={currentStatus}
                disabled={!id || submitting}
                onChange={(e) => {
                  const nextStatus = e.target.value as AmbassadorStatus;
                  if (!id || nextStatus === currentStatus) return;
                  handleQuickStatusUpdate(id, nextStatus);
                }}
              >
                <option value="pending">pending</option>
                <option value="approved">approved</option>
                <option value="rejected">rejected</option>
              </select>
            </div>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Created",
        minWidth: 140,
        valueFormatter: (params) =>
          params.value ? new Date(params.value).toLocaleDateString() : "-",
      },
      {
        headerName: "Action",
        minWidth: 220,
        maxWidth: 260,
        sortable: false,
        filter: false,
        cellRenderer: (params: { data?: Ambassador }) => {
          const row = params.data;
          const id = row ? getIdFromRow(row) : "";
          if (!id) return null;

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openDetails(id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => openEdit(id)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingId === id}
                onClick={() =>
                  openDeleteDialog(id, row?.full_name || "this application")
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [currentPage, pageSize, deletingId, submitting],
  );

  const resetForm = () => {
    setSelectedId("");
    setFormData(defaultFormData);
    setFieldErrors({});
    setErrorMessage("");
  };

  const openCreate = () => {
    resetForm();
    setSelectedAmbassador(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const fetchAndSetOne = async (id: string): Promise<Ambassador | null> => {
    try {
      const data = await getAmbassadorById(id);
      return data;
    } catch (error: any) {
      toast({
        title: "Unable to load ambassador",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const openEdit = async (id: string) => {
    resetForm();
    setFormMode("edit");
    setSelectedId(id);
    setDetailsLoading(true);
    setFormOpen(true);

    const item = await fetchAndSetOne(id);
    if (item) {
      setSelectedAmbassador(item);
      setFormData(mapAmbassadorToForm(item));
    }
    setDetailsLoading(false);
  };

  const openDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    const item = await fetchAndSetOne(id);
    setSelectedAmbassador(item);
    setDetailsLoading(false);
  };

  const openDeleteDialog = (id: string, name: string) => {
    setCandidateDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!candidateDelete?.id) return;

    const success = await deleteApplication(candidateDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setCandidateDelete(null);
      toast({
        title: "Deleted",
        description: "Ambassador application deleted successfully.",
      });
    } else {
      toast({
        title: "Delete failed",
        description: "Unable to delete ambassador application.",
        variant: "destructive",
      });
    }
  };

  const onChangeField = (key: keyof AmbassadorFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateForm = (): boolean => {
    setFieldErrors({});

    try {
      if (formMode === "create") {
        ambassadorApplySchema.parse(toCreatePayload(formData));
      } else {
        ambassadorUpdateSchema.parse(toUpdatePayload(formData));
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFieldErrors(mapZodErrors(error));
      }
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    let success = false;
    if (formMode === "create") {
      success = await createApplication(toCreatePayload(formData));
    } else {
      if (!selectedId) return;
      success = await updateApplication(selectedId, toUpdatePayload(formData));
    }

    if (success) {
      setFormOpen(false);
      resetForm();
      toast({
        title:
          formMode === "create"
            ? "Application submitted"
            : "Application updated",
        description:
          formMode === "create"
            ? "Ambassador application created successfully."
            : "Ambassador application updated successfully.",
      });
    } else {
      toast({
        title: "Request failed",
        description: errorMessage || "Please review the form and try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center px-4 md:px-6">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view ambassador management.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      {loading && <LoadingScreen inside={true} />}

      <div className="flex-1 flex flex-col overflow-hidden py-4 md:py-6">
        <div className="flex items-center justify-between mb-6 gap-3 px-4 md:px-6 ">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ambassador</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage ambassador applications with review-friendly tools.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={fetchAmbassadors}>
              <RefreshCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {/* <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              New Application
            </Button> */}
          </div>
        </div>

        <div className="px-4 md:px-6">
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Search</Label>
                <Input
                  value={searchQuery}
                  placeholder="Search by name, email, city, organization"
                  onChange={(e) => onChangeSearch(e.target.value)}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(value: "all" | AmbassadorStatus) =>
                    onChangeStatus(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    onChangeSearch("");
                    onChangeStatus("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {errorMessage && (
          <div className="px-4 md:px-6">
            <Card className="p-4 mb-4 border-red-200 bg-red-50">
              <div className="flex items-start gap-2 text-red-700">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <p className="text-sm">{errorMessage}</p>
              </div>
            </Card>
          </div>
        )}

        {ambassadors.length > 0 ? (
          <div className="flex-1 flex flex-col px-4 md:px-6 overflow-hidden ">
            <div className="overflow-auto flex-1 max-w-[100%] border rounded-lg border-gray-200">
              <AgGridReact<Ambassador>
                rowData={[...ambassadors]}
                columnDefs={columnDefs}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center px-4 md:px-6 ">
            <Card className="p-8 text-center max-w-md">
              <h2 className="text-lg font-semibold">
                No ambassador applications found
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Try changing filters or create a new ambassador application.
              </p>
            </Card>
          </div>
        )}

        <div className="px-4 md:px-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            limitNum={pageSize}
          />
        </div>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formMode === "create"
                ? "Create Application"
                : "Edit Application"}
            </DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "Fill in the details to submit a new ambassador application."
                : "Update ambassador application details and status."}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => onChangeField("full_name", e.target.value)}
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Email *</Label>
                  <Input
                    value={formData.email}
                    type="email"
                    onChange={(e) => onChangeField("email", e.target.value)}
                  />
                  {fieldErrors.email && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <Label>City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => onChangeField("city", e.target.value)}
                  />
                  {fieldErrors.city && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.city}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    value={formData.phone_number}
                    placeholder="+919876543210"
                    onChange={(e) =>
                      onChangeField("phone_number", e.target.value)
                    }
                  />
                  {fieldErrors.phone_number && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.phone_number}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Organization</Label>
                  <Input
                    value={formData.organization}
                    onChange={(e) =>
                      onChangeField("organization", e.target.value)
                    }
                  />
                </div>

                <div>
                  <Label>Contribution Preference</Label>
                  <Input
                    value={formData.contribution_preference}
                    onChange={(e) =>
                      onChangeField("contribution_preference", e.target.value)
                    }
                  />
                </div>
              </div>

              {formMode === "edit" && (
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: AmbassadorStatus) =>
                      onChangeField("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Motivation *</Label>
                <Textarea
                  value={formData.motivation}
                  className="min-h-[120px]"
                  onChange={(e) => onChangeField("motivation", e.target.value)}
                />
                {fieldErrors.motivation && (
                  <p className="text-xs text-red-600 mt-1">
                    {fieldErrors.motivation}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={submitting || detailsLoading}
              onClick={handleSubmit}
            >
              {submitting
                ? "Saving..."
                : formMode === "create"
                  ? "Submit"
                  : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ambassador Details</DialogTitle>
            <DialogDescription>
              Read-only details for this ambassador application.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading details...
            </div>
          ) : !selectedAmbassador ? (
            <p className="text-sm text-muted-foreground">
              No details available.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Name" value={selectedAmbassador.full_name} />
              <Detail label="Email" value={selectedAmbassador.email} />
              <Detail label="City" value={selectedAmbassador.city} />
              <Detail label="Phone" value={selectedAmbassador.phone_number} />
              <Detail
                label="Organization"
                value={selectedAmbassador.organization || "-"}
              />
              <Detail
                label="Contribution Preference"
                value={selectedAmbassador.contribution_preference || "-"}
              />
              <Detail
                label="Status"
                value={
                  <Badge
                    className={getStatusClasses(selectedAmbassador.status)}
                  >
                    {selectedAmbassador.status || "pending"}
                  </Badge>
                }
              />
              <Detail
                label="Created"
                value={
                  selectedAmbassador.createdAt
                    ? new Date(selectedAmbassador.createdAt).toLocaleString()
                    : "-"
                }
              />
              <div className="md:col-span-2">
                <p className="text-xs text-muted-foreground">Motivation</p>
                <p className="mt-1 whitespace-pre-wrap">
                  {selectedAmbassador.motivation || "-"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setCandidateDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Ambassador Application</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {candidateDelete?.name || "this application"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!candidateDelete?.id || !!deletingId}
              onClick={handleDelete}
            >
              {deletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
};

type DetailProps = {
  label: string;
  value: React.ReactNode;
};

const Detail = ({ label, value }: DetailProps) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <div className="mt-1">{value}</div>
  </div>
);

export default AmbassadorPage;
