/**
 * Cliente HTTP hacia el API (baseURL desde VITE_API_BASE, proxy /api en dev).
 */

export const AUTH_TOKEN_STORAGE_KEY = 'clubfutbolin.auth.token';

export const getStoredAuthToken = (): string | null =>
  typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) : null;

export const setStoredAuthToken = (token: string): void => {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredAuthToken = (): void => {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown = undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getApiBase = (): string => (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '');

/** URL absoluta del API para un path que empieza por `/`. */
export const apiUrl = (path: string): string => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBase()}${p}`;
};

const mergeHeaders = (init: RequestInit): Headers => {
  const headers = new Headers(init.headers);
  const token = getStoredAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
};

/**
 * `fetch` con base URL y cabeceras comunes. No lanza por status HTTP; usar `apiJson` para eso.
 */
export const apiFetch = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const headers = mergeHeaders(init);
  if (
    !headers.has('Content-Type') &&
    init.body !== undefined &&
    typeof init.body === 'string'
  ) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(apiUrl(path), { ...init, headers });
};

const parseJsonSafe = (text: string): unknown => {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const messageFromBody = (body: unknown, fallback: string): string => {
  if (
    typeof body === 'object' &&
    body !== null &&
    'message' in body &&
    typeof (body as { message: unknown }).message === 'string'
  ) {
    return (body as { message: string }).message;
  }
  return fallback;
};

export type ApiJsonInit = Omit<RequestInit, 'body'> & {
  /** Objeto serializable a JSON (o `FormData` / `string` / `Blob` como en `fetch`). */
  body?: unknown;
};

/**
 * Petición JSON: serializa `body` objeto plano, añade `Authorization` si hay token,
 * y lanza `ApiError` si la respuesta no es OK.
 */
export const apiJson = async <T>(path: string, init: ApiJsonInit = {}): Promise<T> => {
  const { body, ...rest } = init;
  const resolvedBody =
    body !== undefined && typeof body === 'object' && !(body instanceof FormData)
      ? JSON.stringify(body)
      : (body as BodyInit | null | undefined);

  const res = await apiFetch(path, { ...rest, body: resolvedBody });
  const text = await res.text();
  const parsed = parseJsonSafe(text);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      messageFromBody(parsed, res.statusText),
      parsed,
    );
  }

  if (res.status === 204 || text === '') {
    return undefined as T;
  }

  return parsed as T;
};
