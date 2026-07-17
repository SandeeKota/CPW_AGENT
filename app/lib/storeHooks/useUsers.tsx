import { useEffect, useState } from "react";
import api from "@/app/_services/api_service";
import { UserSchema } from "@/app/_types/user.type";

interface UsersResponse {
  error: boolean;
  data: UserSchema[];
  count: number;
  total: number;
  page: number;
  totalPages: number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<UserSchema[]>([]);
  const [count, setCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pageCurrent, setPageCurrent] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async (
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
  ) => {
    try {
      setLoading(search ? false : true);
      const queryParams = new URLSearchParams({
        limit: String(limit),
        page: String(page || 0),
        search: search || "",
      });

      if (role) {
        queryParams.append("role", role);
      }

      const res = await api.get(`/v1/users?${queryParams.toString()}`);
      const response: UsersResponse = res.data;

      if (
        res &&
        res.status === 200 &&
        response.data &&
        response.error === false
      ) {
        setUsers(response.data);
        setCount(response.count);
        setTotal(response.total);
        setPageCurrent(response.page);
        setTotalPages(response.totalPages);
        setError("");
        return;
      }

      setUsers([]);
      setCount(0);
      setTotal(0);
      setPageCurrent(1);
      setTotalPages(1);
      setError("Error fetching users data");
    } catch (err) {
      setError("Error fetching users");
      setUsers([]);
      setCount(0);
      setTotal(0);
      setPageCurrent(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    setUsers, // ✅ Expose this so component can update user list
    total,
    totalPages,
    pageCurrent,
    count,
    loading,
    error,
    fetchUsers,
  };
};
