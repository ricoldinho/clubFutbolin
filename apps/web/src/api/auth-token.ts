export interface AuthTokenPayload {
  sub?: string;
  role?: string;
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
};

export const parseAuthTokenPayload = (token: string | null): AuthTokenPayload | null => {
  if (!token) return null;
  const chunks = token.split('.');
  if (chunks.length !== 3) return null;

  try {
    return JSON.parse(decodeBase64Url(chunks[1])) as AuthTokenPayload;
  } catch {
    return null;
  }
};
