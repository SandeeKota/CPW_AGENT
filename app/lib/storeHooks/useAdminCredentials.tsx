import { useEffect, useState, useCallback } from "react";
import api from "@/app/_services/api_service";
import { AdminCredentialEnum } from "@/app/_types/admin-credential.enum";

export interface AdminCredential {
  _id: string;
  user_id: string;
  credential: string;
  enabled: boolean;
}

const rootCredentialsCache = new Map<string, AdminCredential[]>();
const rootCredentialsInFlight = new Map<string, Promise<AdminCredential[]>>();

const fetchNormalizedCredentials = async (
  userId: string,
): Promise<AdminCredential[]> => {
  const res = await api.get(`/v1/admin-credentials/${userId}`);
  const apiData = Array.isArray(res.data?.data) ? res.data.data[0] : undefined;
  const enabledTypes: string[] = apiData?.type || [];
  return AdminCredentialEnum.options.map((cred) => ({
    _id: apiData?._id || "",
    user_id: apiData?.user_id || userId,
    credential: cred,
    enabled: enabledTypes.includes(cred),
  }));
};

export const useAdminCredentials = (userId?: string | null) => {
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For root user credentials
  const [rootUserCredentials, setRootUserCredentials] = useState<
    AdminCredential[]
  >([]);
  const [rootLoading, setRootLoading] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setCredentials([]);
      return;
    }
    setLoading(true);
    api
      .get(`/v1/admin-credentials/${userId}`)
      .then((res) => {
        // Normalize response: always return all credential types with enabled status
        const apiData = Array.isArray(res.data?.data)
          ? res.data.data[0]
          : undefined;
        const enabledTypes: string[] = apiData?.type || [];
        const normalized: AdminCredential[] = AdminCredentialEnum.options.map(
          (cred) => ({
            _id: apiData?._id || "",
            user_id: apiData?.user_id || userId,
            credential: cred,
            enabled: enabledTypes.includes(cred),
          }),
        );
        setCredentials(normalized);
        setError(null);
      })
      .catch((err) => {
        setError("Failed to fetch admin credentials");
        setCredentials([]);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  // Fetch root user credentials by rootUserId
  const fetchRootUserCredentials = useCallback(async (rootUserId: string) => {
    setRootLoading(true);
    try {
      const res = await api.get(`/v1/admin-credentials/${rootUserId}`);
      const apiData = Array.isArray(res.data?.data)
        ? res.data.data[0]
        : undefined;
      const enabledTypes: string[] = apiData?.type || [];
      const normalized: AdminCredential[] = AdminCredentialEnum.options.map(
        (cred) => ({
          _id: apiData?._id || "",
          user_id: apiData?.user_id || rootUserId,
          credential: cred,
          enabled: enabledTypes.includes(cred),
        }),
      );
      setRootUserCredentials(normalized);
      setRootError(null);
    } catch (err) {
      setRootUserCredentials([]);
      setRootError("Failed to fetch root user credentials");
    } finally {
      setRootLoading(false);
    }
  }, []);

  return {
    credentials,
    loading,
    error,
    setCredentials,
    rootUserCredentials,
    rootLoading,
    rootError,
    fetchRootUserCredentials,
  };
};

// Optional: export a separate hook for root user credentials
export const useRootUserCredentials = (rootUserId?: string | null) => {
  const [credentials, setCredentials] = useState<AdminCredential[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!rootUserId) {
      setCredentials([]);
      return;
    }

    const cached = rootCredentialsCache.get(rootUserId);
    if (cached) {
      setCredentials(cached);
      setError(null);
      return;
    }

    setLoading(true);
    const inFlightRequest =
      rootCredentialsInFlight.get(rootUserId) ||
      fetchNormalizedCredentials(rootUserId);

    rootCredentialsInFlight.set(rootUserId, inFlightRequest);

    inFlightRequest
      .then((normalized) => {
        if (cancelled) return;
        rootCredentialsCache.set(rootUserId, normalized);
        setCredentials(normalized);
        setError(null);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to fetch root user credentials");
        setCredentials([]);
      })
      .finally(() => {
        rootCredentialsInFlight.delete(rootUserId);
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rootUserId]);

  return { credentials, loading, error, setCredentials };
};
