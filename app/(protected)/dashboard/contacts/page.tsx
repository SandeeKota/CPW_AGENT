"use client";
import React, { useEffect, useState } from "react";
import LoadingScreen from "@/app/components/loadingScreen";
import { useTheme } from "next-themes";
import { getContacts } from "@/app/_services/contscts.service";
import { useAuthStore } from "@/app/stores/authStore";
import Pagination from "@/app/components/pagination";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  ColDef,
  ValueGetterParams,
} from "ag-grid-community";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/app/components/ui/accordion";
import { useRouter } from "next/navigation";
ModuleRegistry.registerModules([AllCommunityModule]);

const DEFAUT_PAGE_SIZE = 10;

export type ContactRow = {
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  inquiryType?: string;
  message?: string;
  createdAt?: string;
};

const ContactPage = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin" && user?.isAdminMode;
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(DEFAUT_PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalContacts, setTotalContacts] = useState<number>(0);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(
    null,
  );

  const [colDefs, setColDefs] = useState<ColDef<ContactRow>[]>([
    {
      headerName: "S.No",
      width: 90,
      pinned: "left",
      sortable: false,
      filter: false,
      valueGetter: (params: ValueGetterParams<ContactRow>) =>
        params?.node?.rowIndex != null
          ? (currentPage - 1) * pageSize + params.node.rowIndex + 1
          : "",
    },
    {
      field: "name",
      flex: 1,
      minWidth: 150,
      maxWidth: 300,
    },
    {
      field: "email",
      flex: 1,
      minWidth: 150,
      maxWidth: 300,
    },
    {
      field: "phone",
      flex: 1,
      minWidth: 150,
      maxWidth: 300,
    },
    {
      field: "subject",
      minWidth: 250,
      maxWidth: 500,
      flex: 1,
    },
    {
      field: "inquiryType",
      minWidth: 250,
      maxWidth: 500,
      flex: 1,
    },
    {
      field: "message",
      minWidth: 250,
      maxWidth: 500,
      flex: 1,
    },
    {
      headerName: "Action",
      minWidth: 130,
      maxWidth: 150,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (params: { data?: ContactRow }) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setSelectedContact(params.data || null)}
        >
          View
        </Button>
      ),
    },
    {
      field: "createdAt",
      flex: 1,
      minWidth: 150,
      headerName: "Created At",
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
  ]);

  useEffect(() => {
    router?.replace("/dashboard/inquiries");
    // loadContacts();
  }, []);
  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await getContacts(currentPage, pageSize, "");
      if (response && response?.data) {
        setContacts(response?.data);
        setCurrentPage(response?.pagination?.page || 1);
        setTotalPages(response?.pagination?.totalPages || 1);
        setTotalContacts(response?.pagination?.total || 0);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    // loadContacts();
  }, [currentPage]);

  return (
    <React.Fragment>
      {loading && <LoadingScreen inside={true} />}
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

      {!loading && (
        <div className="flex-1 flex flex-col overflow-hidden py-4 md:py-6 ">
          <div className="flex items-center justify-between mb-6 px-4 md:px-6">
            <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
            {/* <Link href={"/dashboard/contacts/contact-us"} >
                                <Button
                                    onClick={() => loadContacts()}>
                                    Add New Query
                                </Button>
                            </Link> */}
          </div>
          {contacts && contacts.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 ">
              <div className="overflow-auto flex-1 max-w-[100%] border rounded-lg border-gray-200  ">
                <AgGridReact rowData={[...contacts]} columnDefs={colDefs} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p>No queries received yet.</p>
            </div>
          )}

          <div className="px-4 md:px-6 w-full ">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(value) => setCurrentPage(value)}
              totalItems={totalContacts || 0}
              limitNum={pageSize}
            />
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default ContactPage;

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
