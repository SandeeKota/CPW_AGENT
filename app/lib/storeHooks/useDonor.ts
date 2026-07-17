import api from "@/app/_services/api_service";
import { DonarDocs } from "@/app/_types/domor.schema";
import { useRef, useState } from "react";

export interface PaginationResponse<T> {
  success: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  data: T[];
}

export const useDonorsDonationsByContactOr = ({
  page: initialPage = 1,
  pageSize: initialPageSize = 10,
}) => {
  const [donors, setDonors] = useState<DonarDocs[]>([]);
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRequestKeyRef = useRef<string | null>(null);

  const fetchDonors = async (
    page: number,
    pageSize: number,
    search: string,
  ) => {
    const requestKey = `${page}:${pageSize}:${search || ""}`;

    if (inFlightRequestKeyRef.current === requestKey) {
      return;
    }

    inFlightRequestKeyRef.current = requestKey;

    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search: search || "",
      });
      const res = await api.get(`/v1/donors?${query.toString()}`);

      const dataSet = res.data as PaginationResponse<DonarDocs>;

      if (
        res &&
        res.status === 200 &&
        res.data &&
        dataSet.success &&
        dataSet.data
      ) {
        setDonors(dataSet.data);
        setPage(dataSet.page);
        setPageSize(dataSet.pageSize);
        setTotal(dataSet.total);
        setTotalPages(dataSet.totalPages);
        setError(null);
        setLoading(false);
      } else {
        setDonors([]);
        setPage(0);
        setPageSize(0);
        setTotal(0);
        setTotalPages(0);
        setLoading(false);
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
    } catch (err: any) {
      setDonors([]);
      setPage(0);
      setPageSize(0);
      setTotal(0);
      setTotalPages(0);
      setLoading(false);
    } finally {
      if (inFlightRequestKeyRef.current === requestKey) {
        inFlightRequestKeyRef.current = null;
      }
    }
  };

  const getDigitalCertifiates = async (id: string) => {
    try {
      if (!id) {
        return [];
      }
      const res = await api.get(`/v1/donors/${id}/certificates`);
      if (
        res &&
        res.status === 200 &&
        res.data &&
        res.data.success &&
        res.data.data
      ) {
        return res.data.data;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  };

  return {
    donors,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    total,
    setPage,
    setPageSize,
    getDigitalCertifiates,
    fetchDonors,
  };
};
