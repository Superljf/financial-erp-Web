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

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
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

async function handleResponse<T>(path: string, res: Response): Promise<T> {
  if (res.status === 401 || res.status === 403) {
    triggerUnauthorized(path);
  }

  const body = await parseJsonSafe(res);
  if (body && typeof body === 'object' && 'success' in body) {
    const envelope = body as ApiEnvelope<T>;
    if (!envelope.success) {
      throw new ApiError(envelope.message || '请求失败', res.status, envelope.data);
    }
    return envelope.data;
  }

  if (!res.ok) {
    throw new ApiError(failMessage(body, res.statusText || '请求失败'), res.status, body);
  }

  return (body as T) ?? (undefined as T);
}

export async function requestJson<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; json?: unknown } = {},
): Promise<T> {
  const { skipAuth, json, headers: extraHeaders, ...rest } = options;
  const headers = authHeaders(extraHeaders, skipAuth);
  let body = rest.body;
  if (json !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(path, { ...rest, headers, body });
  } catch {
    throw new ApiError('无法连接服务器，请确认后端已启动', 0);
  }

  return handleResponse<T>(path, res);
}

export async function requestBlob(
  path: string,
  fallbackName: string,
): Promise<{ blob: Blob; filename: string }> {
  const headers = authHeaders();
  let res: Response;
  try {
    res = await fetch(path, { headers });
  } catch {
    throw new ApiError('无法连接服务器，请确认后端已启动', 0);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || contentType.includes('application/json')) {
    if (res.status === 401 || res.status === 403) triggerUnauthorized(path);
    const body = await parseJsonSafe(res);
    if (body && typeof body === 'object' && 'success' in body) {
      const envelope = body as ApiEnvelope<unknown>;
      throw new ApiError(envelope.message || '下载失败', res.status, envelope.data);
    }
    throw new ApiError(failMessage(body, '下载失败'), res.status, body);
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
