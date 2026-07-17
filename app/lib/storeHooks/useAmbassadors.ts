import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAmbassador,
  deleteAmbassador,
  getAllAmbassadors,
  updateAmbassador,
} from "@/app/_services/ambassador.service";
import {
  Ambassador,
  AmbassadorApplyInput,
  AmbassadorStatus,
  AmbassadorUpdateInput,
} from "@/app/_types/ambassador.type";

const PAGE_SIZE = 10;
const DEBOUNCE_MS = 400;

export const useAmbassadors = () => {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | AmbassadorStatus>(
    "all",
  );
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search query
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [searchQuery]);

  const fetchAmbassadors = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getAllAmbassadors({
        page: currentPage,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        status: statusFilter === "all" ? undefined : statusFilter,
      });

      setAmbassadors(response.data || []);
      setCurrentPage(response.pagination?.page || 1);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error: any) {
      setAmbassadors([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotalItems(0);
      setErrorMessage(
        error?.message || "Unable to load ambassador applications.",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchAmbassadors();
  }, [fetchAmbassadors]);

  const onChangeSearch = (value: string) => {
    setCurrentPage(1);
    setSearchQuery(value);
  };

  const onChangeStatus = (value: "all" | AmbassadorStatus) => {
    setCurrentPage(1);
    setStatusFilter(value);
  };

  const createApplication = async (payload: AmbassadorApplyInput) => {
    try {
      setSubmitting(true);
      setErrorMessage("");
      await createAmbassador(payload);
      await fetchAmbassadors();
      return true;
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Unable to create ambassador application.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const updateApplication = async (
    id: string,
    payload: AmbassadorUpdateInput,
  ) => {
    try {
      setSubmitting(true);
      setErrorMessage("");
      await updateAmbassador(id, payload);
      await fetchAmbassadors();
      return true;
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Unable to update ambassador application.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const deleteApplication = async (id: string) => {
    try {
      setDeletingId(id);
      setErrorMessage("");
      await deleteAmbassador(id);
      await fetchAmbassadors();
      return true;
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Unable to delete ambassador application.",
      );
      return false;
    } finally {
      setDeletingId("");
    }
  };

  return {
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
    pageSize: PAGE_SIZE,
    setCurrentPage,
    onChangeSearch,
    onChangeStatus,
    fetchAmbassadors,
    createApplication,
    updateApplication,
    deleteApplication,
    setErrorMessage,
  };
};
