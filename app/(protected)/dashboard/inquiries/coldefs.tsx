import { ColDef, ValueGetterParams } from "ag-grid-community";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Ambassador, AmbassadorStatus } from "@/app/_types/ambassador.type";

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

type CreateContactColDefsParams = {
  currentPage: number;
  pageSize: number;
  onView: (row: ContactRow) => void;
  deletingId?: string;
  getIdFromRow: (row: ContactRow) => string;
  onDelete: (id: string, name: string) => void;
  hasContactUSPermission: boolean;
};

export const createContactColDefs = ({
  currentPage,
  pageSize,
  onView,
  deletingId = "",
  getIdFromRow,
  onDelete,
  hasContactUSPermission = false,
}: CreateContactColDefsParams): ColDef<ContactRow>[] => {
  return [
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
      headerName: hasContactUSPermission ? "Action" : "",
      hide: !hasContactUSPermission,
      minWidth: 200,
      maxWidth: 240,
      sortable: false,
      filter: false,
      pinned: "right",
      cellRenderer: (params: { data?: ContactRow }) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => params.data && onView(params.data)}
          >
            View
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={!params.data || deletingId === getIdFromRow(params.data)}
            onClick={() => {
              if (!params.data) return;
              const id = getIdFromRow(params.data);
              if (!id) return;
              onDelete(id, params.data.name || "this inquiry");
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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
  ];
};

type CreateAmbassadorColDefsParams = {
  currentPage: number;
  pageSize: number;
  deletingId?: string;
  submitting?: boolean;
  getIdFromRow: (row: Ambassador) => string;
  getStatusClasses: (status?: AmbassadorStatus) => string;
  onQuickStatusUpdate: (id: string, status: AmbassadorStatus) => void;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  hasAmasidorePermission: boolean; // ✅ add this
};

export const createAmbassadorColDefs = ({
  currentPage,
  pageSize,
  deletingId = "",
  submitting = false,
  getIdFromRow,
  getStatusClasses,
  onQuickStatusUpdate,
  onViewDetails,
  onEdit,
  onDelete,
  hasAmasidorePermission = false,
}: CreateAmbassadorColDefsParams): ColDef<Ambassador>[] => {
  const parseCityCountry = (location?: string) => {
    if (!location) return { city: "-", country: "-" };

    const parts = location
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    return {
      city: parts[0] || "-",
      country: parts.slice(1).join(", ") || "-",
    };
  };

  return [
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
      valueGetter: (params: ValueGetterParams<Ambassador>) =>
        params.data?.city
          ? params.data?.city
          : parseCityCountry(params.data?.city).city,
    },
    {
      colId: "country",
      headerName: "Country",
      minWidth: 140,
      valueGetter: (params: ValueGetterParams<Ambassador>) =>
        params.data?.country ? params.data?.country : "-",
    },
    {
      field: "phone_number",
      headerName: "Phone",
      minWidth: 170,
    },
    {
      field: "organization",
      headerName: "Organization",
      minWidth: 170,
    },
    {
      field: "motivation",
      headerName: "Motivation",
      minWidth: 170,
    },
    // {
    //     field: "status",
    //     headerName: "Status",
    //     minWidth: 210,
    //     cellRenderer: (params: { data?: Ambassador; value?: AmbassadorStatus }) => {
    //         const row = params.data;
    //         const id = row ? getIdFromRow(row) : "";
    //         const currentStatus = params.value || "pending";

    //         return (
    //             <div className="flex items-center gap-2">
    //                 <Badge className={getStatusClasses(currentStatus)}>{currentStatus}</Badge>
    //                 <select
    //                     className="h-8 rounded-md border border-input bg-background px-2 text-xs"
    //                     value={currentStatus}
    //                     disabled={!id || submitting}
    //                     onChange={(e) => {
    //                         const nextStatus = e.target.value as AmbassadorStatus;
    //                         if (!id || nextStatus === currentStatus) return;
    //                         onQuickStatusUpdate(id, nextStatus);
    //                     }}
    //                 >
    //                     <option value="pending">pending</option>
    //                     <option value="approved">approved</option>
    //                     <option value="rejected">rejected</option>
    //                 </select>
    //             </div>
    //         );
    //     },
    // },
    {
      field: "createdAt",
      headerName: "Created",
      minWidth: 140,
      valueFormatter: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "-",
    },
    {
      headerName: hasAmasidorePermission ? "Action" : "",
      hide: !hasAmasidorePermission,
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
              onClick={() => onViewDetails(id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEdit(id)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deletingId === id}
              onClick={() => onDelete(id, row?.full_name || "this application")}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
};
