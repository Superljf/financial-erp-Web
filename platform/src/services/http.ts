const TOKEN_KEY = 'klxx-admin-token';

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  json?: unknown;
  /** 由调用方自行展示错误时跳过全局 toast */
  skipErrorToast?: boolean;
};

let onUnauthorized: (() => void) | null = null;
let errorNotifier: ((content: string) => void) | null = null;
let lastErrorToast = '';
let lastErrorToastAt = 0;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function setRequestErrorNotifier(notifier: ((content: string) => void) | null) {
  errorNotifier = notifier;
}

function notifyError(content: string, skipToast?: boolean) {
  if (skipToast || !content) return;
  const now = Date.now();
  if (content === lastErrorToast && now - lastErrorToastAt < 1000) return;
  lastErrorToast = content;
  lastErrorToastAt = now;
  errorNotifier?.(content);
}

export function getToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) ?? '';
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function queryString(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : '';
}

function authHeaders(extra?: HeadersInit, skipAuth = false): Headers {
  const headers = new Headers(extra);
  const token = getToken();
  if (!skipAuth && token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

function isAuthPath(path: string): boolean {
  return path.startsWith('/api/auth/');
}

function triggerUnauthorized(path: string) {
  if (isAuthPath(path)) return;
  clearToken();
  onUnauthorized?.();
}

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function failMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }
  return fallback;
}

function throwApiError(message: string, status: number, data?: unknown, skipToast?: boolean): never {
  notifyError(message, skipToast);
  throw new ApiError(message, status, data);
}

async function handleResponse<T>(path: string, res: Response, skipToast?: boolean): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    triggerUnauthorized(path);
  }

  const body = await parseJsonSafe(res);
  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ApiEnvelope<T>;
    if (!envelope.success) {
      throwApiError(envelope.message || '请求失败', res.status, envelope.data, skipToast);
    }
    return envelope.data;
  }

  if (!res.ok) {
    throwApiError(failMessage(body, res.statusText || '请求失败'), res.status, body, skipToast);
  }

  return (body as T) ?? (undefined as T);
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (err instanceof Error && err.name === 'AbortError')
  );
}

export { isAbortError };

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, json, skipErrorToast, headers: extraHeaders, ...rest } = options;
  const headers = authHeaders(extraHeaders, skipAuth);
  let body = rest.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(path, { ...rest, headers, body });
  } catch (err) {
    if (isAbortError(err)) throw err;
    throwApiError('无法连接服务器，请确认后端已启动', 0, undefined, skipErrorToast);
  }

  return handleResponse<T>(path, res, skipErrorToast);
}

export async function requestBlob(
  path: string,
  fallbackName: string,
  options: Pick<RequestOptions, 'skipErrorToast'> = {},
): Promise<{ blob: Blob; filename: string }> {
  const headers = authHeaders();
  let res: Response;
  try {
    res = await fetch(path, { headers });
  } catch {
    throwApiError('无法连接服务器，请确认后端已启动', 0, undefined, options.skipErrorToast);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    if (res.status === 401 || res.status === 403) triggerUnauthorized(path);
    const body = await parseJsonSafe(res);
    if (body && typeof body === 'object' && 'success' in body) {
      const envelope = body as ApiEnvelope<unknown>;
      throwApiError(envelope.message || '下载失败', res.status, envelope.data, options.skipErrorToast);
    }
    throwApiError(failMessage(body, '下载失败'), res.status, body, options.skipErrorToast);
  }

  const blob = await res.blob();
  return { blob, filename: parseFilename(res.headers.get('content-disposition'), fallbackName) };
}

function parseFilename(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain?.[1] || fallback;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
