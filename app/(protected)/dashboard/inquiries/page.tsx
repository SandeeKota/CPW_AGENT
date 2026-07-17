"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { z } from "zod";
import LoadingScreen from "@/app/components/loadingScreen";
import Pagination from "@/app/components/pagination";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
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
import { Badge } from "@/app/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import {
  deleteContactById,
  getContacts,
} from "@/app/_services/contscts.service";
import { getAmbassadorById } from "@/app/_services/ambassador.service";
import { useAmbassadors } from "@/app/lib/storeHooks/useAmbassadors";
import {
  Ambassador,
  AmbassadorStatus,
  AmbassadorUpdateInput,
  ambassadorUpdateSchema,
} from "@/app/_types/ambassador.type";
import { useAuthStore } from "@/app/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  ContactRow,
  createAmbassadorColDefs,
  createContactColDefs,
} from "./coldefs";
import { isUserIsAdminCheck } from "@/lib/constants";
import {
  canAccessAmbassadorManagementPermission,
  canAccessContactUsManagementPermission,
} from "@/app/_types/admin-credential.enum";
import { useAdminCredentials } from "@/app/lib/storeHooks/useAdminCredentials";

ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAULT_CONTACT_PAGE_SIZE = 10;

type ActiveTabEnum = "ambassadors" | "contact-us";
const TABS: { label: string; value: ActiveTabEnum }[] = [
  {
    label: "Ambassadors",
    value: "ambassadors",
  },
  {
    label: "Contact Us",
    value: "contact-us",
  },
];

type AmbassadorFormData = {
  full_name: string;
  email: string;
  organization: string;
  city: string;
  country: string;
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
  country: "",
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
    country: item.country || "",
    phone_number: item.phone_number || "",
    contribution_preference: item.contribution_preference || "",
    motivation: item.motivation || "",
    status: item.status || "pending",
  };
};

const toOptionalString = (value: string): string | undefined => {
  return value.trim().length ? value.trim() : undefined;
};

const toUpdatePayload = (
  formData: AmbassadorFormData,
): AmbassadorUpdateInput => ({
  full_name: formData.full_name,
  email: formData.email,
  organization: toOptionalString(formData.organization),
  city: formData.city,
  country: formData.country,
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

function InquiriesPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const isAdmin = isUserIsAdminCheck(user);

  const [activeTab, setActiveTab] = useState<ActiveTabEnum>("ambassadors");

  // Contact state
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactLoading, setContactLoading] = useState<boolean>(false);
  const [contactPageSize] = useState<number>(DEFAULT_CONTACT_PAGE_SIZE);
  const [contactCurrentPage, setContactCurrentPage] = useState<number>(1);
  const [contactTotalPages, setContactTotalPages] = useState<number>(1);
  const [contactTotalItems, setContactTotalItems] = useState<number>(0);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(
    null,
  );
  const [contactDeletingId, setContactDeletingId] = useState<string>("");
  const [contactDeleteDialogOpen, setContactDeleteDialogOpen] =
    useState<boolean>(false);
  const [candidateContactDelete, setCandidateContactDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Ambassador state and API handlers
  const {
    ambassadors,
    loading: ambassadorLoading,
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
    updateApplication,
    deleteApplication,
    setErrorMessage,
  } = useAmbassadors();

  const hasActiveAmbassadorFilters =
    searchQuery.trim().length > 0 || statusFilter !== "all";

  const { credentials } = useAdminCredentials(user?._id);
  const hasAmasidorePermission = canAccessAmbassadorManagementPermission(
    isAdmin,
    credentials,
    user?.role,
  );
  const hasContactUSPermission = canAccessContactUsManagementPermission(
    isAdmin,
    credentials,
    user?.role,
  );

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
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<AmbassadorFormData>(defaultFormData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const getContactIdFromRow = (row: ContactRow): string => {
    if (!row?._id) return "";
    if (typeof row._id === "string") return row._id;
    if ((row._id as any)?.$oid) return String((row._id as any).$oid);
    if (typeof (row._id as any)?.toString === "function")
      return (row._id as any).toString();
    return String(row._id);
  };

  const openDeleteContactDialog = (id: string, name: string) => {
    setCandidateContactDelete({ id, name });
    setContactDeleteDialogOpen(true);
  };

  const handleDeleteContact = async () => {
    if (!candidateContactDelete?.id) return;

    try {
      setContactDeletingId(candidateContactDelete.id);
      const success = await deleteContactById(candidateContactDelete.id);
      if (success) {
        setContactDeleteDialogOpen(false);
        setCandidateContactDelete(null);
        toast({
          title: "Deleted",
          description: "Contact inquiry deleted successfully.",
        });
        await loadContacts();
      } else {
        toast({
          title: "Delete failed",
          description: "Unable to delete contact inquiry.",
          variant: "destructive",
        });
      }
    } finally {
      setContactDeletingId("");
    }
  };

  const colDefsContacts = useMemo(
    () =>
      createContactColDefs({
        currentPage: contactCurrentPage,
        pageSize: contactPageSize,
        onView: (row) => setSelectedContact(row),
        deletingId: contactDeletingId,
        getIdFromRow: getContactIdFromRow,
        onDelete: openDeleteContactDialog,
        hasContactUSPermission,
      }),
    [
      contactCurrentPage,
      contactPageSize,
      contactDeletingId,
      hasContactUSPermission,
    ],
  );

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

  const openDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsLoading(true);
    const item = await fetchAndSetOne(id);
    setSelectedAmbassador(item);
    setDetailsLoading(false);
  };

  const openEdit = async (id: string) => {
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

  const colDefsAmbassadors = useMemo(
    () =>
      createAmbassadorColDefs({
        currentPage,
        pageSize,
        deletingId,
        submitting,
        getIdFromRow,
        getStatusClasses,
        onQuickStatusUpdate: handleQuickStatusUpdate,
        onViewDetails: openDetails,
        onEdit: openEdit,
        onDelete: openDeleteDialog,
        hasAmasidorePermission,
      }),
    [currentPage, pageSize, deletingId, submitting, hasAmasidorePermission],
  );

  const loadContacts = async () => {
    try {
      setContactLoading(true);
      const response = await getContacts(
        contactCurrentPage,
        contactPageSize,
        "",
      );
      if (response && response?.data) {
        setContacts(response?.data);
        setContactCurrentPage(response?.pagination?.page || 1);
        setContactTotalPages(response?.pagination?.totalPages || 1);
        setContactTotalItems(response?.pagination?.total || 0);
      }
      setContactLoading(false);
    } catch (error) {
      setContactLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "contact-us") {
      loadContacts();
    }
  }, [activeTab, contactCurrentPage]);

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
      ambassadorUpdateSchema.parse(toUpdatePayload(formData));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setFieldErrors(mapZodErrors(error));
      }
      return false;
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedId) return;
    if (!validateForm()) return;

    const success = await updateApplication(
      selectedId,
      toUpdatePayload(formData),
    );
    if (success) {
      setFormOpen(false);
      setErrorMessage("");
      console?.log(`${"Ambassador application updated successfully."}`);
    } else {
      console?.log(
        `${errorMessage || "Please review the form and try again."}`,
      );
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center px-4 md:px-6">
        <Card className="max-w-md p-6 text-center">
          <h1 className="text-xl font-semibold">Unauthorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view inquiries.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <React.Fragment>
      <div className="flex-1 flex flex-col overflow-hidden py-4 md:py-6 ">
        {contactLoading || ambassadorLoading ? (
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
              <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 md:px-6">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {TABS.map((filterItem) => (
                  <Button
                    key={filterItem.value}
                    type="button"
                    variant={
                      activeTab === filterItem.value ? "default" : "outline"
                    }
                    className="rounded-full"
                    onClick={() => setActiveTab(filterItem.value)}
                  >
                    {filterItem.label}
                  </Button>
                ))}
              </div>

              {activeTab === "contact-us" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {contacts.length > 0 ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="overflow-auto flex-1 max-w-[100%] border rounded-lg border-gray-200">
                        <AgGridReact<ContactRow>
                          rowData={[...contacts]}
                          columnDefs={colDefsContacts}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p>No queries received yet.</p>
                    </div>
                  )}

                  <div className="w-full mt-4">
                    <Pagination
                      currentPage={contactCurrentPage}
                      totalPages={contactTotalPages}
                      onPageChange={(value) => setContactCurrentPage(value)}
                      totalItems={contactTotalItems || 0}
                      limitNum={contactPageSize}
                    />
                  </div>
                </div>
              )}

              {activeTab === "ambassadors" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <Card className="p-4 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Search</Label>
                        <Input
                          value={searchQuery}
                          placeholder="Search by name, email, city, country, organization"
                          onChange={(e) => onChangeSearch(e.target.value)}
                        />
                      </div>

                      <div className="flex items-end gap-2 ml-auto">
                        {hasActiveAmbassadorFilters && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              onChangeSearch("");
                              onChangeStatus("all");
                            }}
                          >
                            Clear Filters
                          </Button>
                        )}
                        <Button variant="outline" onClick={fetchAmbassadors}>
                          <RefreshCcw className="h-4 w-4 mr-2" />
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {errorMessage && (
                    <Card className="p-4 mb-4 border-red-200 bg-red-50">
                      <div className="flex items-start gap-2 text-red-700">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <p className="text-sm">{errorMessage}</p>
                      </div>
                    </Card>
                  )}

                  {ambassadors.length > 0 ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="overflow-auto flex-1 max-w-[100%] border rounded-lg border-gray-200">
                        <AgGridReact<Ambassador>
                          rowData={[...ambassadors]}
                          columnDefs={colDefsAmbassadors}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <Card className="p-8 text-center max-w-md">
                        <h2 className="text-lg font-semibold">
                          No ambassador applications found
                        </h2>
                        <p className="text-sm text-muted-foreground mt-2">
                          Try changing filters.
                        </p>
                      </Card>
                    </div>
                  )}

                  <div className="w-full mt-4">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      totalItems={totalItems}
                      limitNum={pageSize}
                    />
                  </div>
                </div>
              )}
            </div>
          </React.Fragment>
        )}
      </div>

      <Dialog
        open={!!selectedContact}
        onOpenChange={(open) => !open && setSelectedContact(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Query Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="grid gap-5 py-2 sm:grid-cols-2">
              <DetailItem label="Name" value={selectedContact.name} />
              <DetailItem label="Email" value={selectedContact.email} />
              <DetailItem label="Phone" value={selectedContact.phone} />
              <DetailItem
                label="Inquiry Type"
                value={selectedContact.inquiryType}
              />
              <DetailItem
                label="Created At"
                value={
                  selectedContact.createdAt
                    ? new Date(selectedContact.createdAt).toLocaleString()
                    : ""
                }
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Accordion
                  type="multiple"
                  className="w-full rounded-lg border bg-muted/20 px-4"
                >
                  <AccordionItem value="subject">
                    <AccordionTrigger className="text-sm font-semibold">
                      Subject
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-lg border bg-background px-4 py-3 text-sm break-words">
                        {selectedContact.subject || "N/A"}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="message">
                    <AccordionTrigger className="text-sm font-semibold">
                      Message
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="min-h-32 rounded-lg border bg-background px-4 py-3 text-sm whitespace-pre-wrap break-words">
                        {selectedContact.message || "N/A"}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setFieldErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
            <DialogDescription>
              Update ambassador application details and status.
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
                  <Label>Country *</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => onChangeField("country", e.target.value)}
                  />
                  {fieldErrors.country && (
                    <p className="text-xs text-red-600 mt-1">
                      {fieldErrors.country}
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
              onClick={handleSubmitEdit}
            >
              {submitting ? "Saving..." : "Update"}
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
              {errorMessage ? errorMessage : "No details available."}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Detail label="Name" value={selectedAmbassador.full_name} />
              <Detail label="Email" value={selectedAmbassador.email} />
              <Detail label="City" value={selectedAmbassador.city} />
              <Detail label="Country" value={selectedAmbassador.country} />
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
        open={contactDeleteDialogOpen}
        onOpenChange={(open) => {
          setContactDeleteDialogOpen(open);
          if (!open) setCandidateContactDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Contact Inquiry</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                {candidateContactDelete?.name || "this inquiry"}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContactDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!candidateContactDelete?.id || !!contactDeletingId}
              onClick={handleDeleteContact}
            >
              {contactDeletingId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
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
}

type DetailItemProps = {
  label: string;
  value?: string;
  className?: string;
  multiline?: boolean;
};

const DetailItem: React.FC<DetailItemProps> = ({
  label,
  value,
  className = "",
  multiline = false,
}) => {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <div
        className={`mt-2 rounded-lg border bg-muted/30 px-4 py-3 text-sm ${multiline ? "min-h-32 whitespace-pre-wrap break-words" : "break-words"}`}
      >
        {value || "N/A"}
      </div>
    </div>
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

export default InquiriesPage;
