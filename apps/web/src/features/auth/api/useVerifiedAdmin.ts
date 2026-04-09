import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AUTH_TOKEN_CHANGED_EVENT,
  AUTH_TOKEN_STORAGE_KEY,
  apiJson,
  getStoredAuthToken,
} from '@/api/client';
import { parseAuthTokenPayload } from '@/api/auth-token';
import { queryKeys } from '@/api/query-keys';

const readToken = (): string | null => getStoredAuthToken();

export const useVerifiedAdmin = () => {
  const [token, setToken] = useState<string | null>(() => readToken());

  useEffect(() => {
    const syncToken = () => setToken(readToken());

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === AUTH_TOKEN_STORAGE_KEY) {
        syncToken();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, syncToken);
    };
  }, []);

  const isAdminClaim = useMemo(() => parseAuthTokenPayload(token)?.role === 'ADMIN', [token]);

  const verificationQuery = useQuery({
    queryKey: queryKeys.auth.verifyAdmin(token ?? 'no-token'),
    queryFn: () => apiJson('/players?page=1&limit=1'),
    enabled: Boolean(token) && isAdminClaim,
    retry: false,
  });

  return {
    token,
    isAdminClaim,
    isVerifiedAdmin: isAdminClaim && verificationQuery.isSuccess,
    isVerifyingAdmin: isAdminClaim && verificationQuery.isPending,
  };
};
