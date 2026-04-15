import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AUTH_SESSION_CHANGED_EVENT, apiJson } from '@/api/client';
import { queryKeys } from '@/api/query-keys';

export interface AuthSessionResponse {
  playerId: string;
  role: string;
}

export const useVerifiedAdmin = () => {
  const [sessionVersion, setSessionVersion] = useState(0);

  useEffect(() => {
    const onSessionChanged = () => {
      setSessionVersion((previous) => previous + 1);
    };
    window.addEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    return () => {
      window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, onSessionChanged);
    };
  }, []);

  const verificationQuery = useQuery({
    queryKey: queryKeys.auth.session(sessionVersion),
    queryFn: () => apiJson<AuthSessionResponse>('/auth/session'),
    enabled: true,
    retry: false,
  });

  const session = verificationQuery.data;
  const isAdminClaim = session?.role === 'ADMIN';

  return {
    session,
    isAdminClaim,
    isVerifiedAdmin: verificationQuery.isSuccess && isAdminClaim,
    isVerifyingAdmin: isAdminClaim && verificationQuery.isPending,
  };
};
