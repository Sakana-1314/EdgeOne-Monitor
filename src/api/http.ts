/**
 * src/api/http.ts —— 带鉴权的 fetch 封装
 * 401 自动清理凭证并跳转登录页
 */

const TOKEN_KEY = 'eo_admin_token';

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t: string | null | undefined): void {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** 查询参数（会被编码为 query string） */
export type HttpParams = Record<string, string | number | undefined>;

/** 请求选项 */
interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  params?: HttpParams;
}

/** 后端统一响应外壳（code/message/data） */
interface ApiEnvelope {
  code?: number;
  message?: string;
  data?: unknown;
}

async function request<T>(path: string, { method = 'GET', body, params }: RequestOptions = {}): Promise<T> {
  let url = path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    url += (url.includes('?') ? '&' : '?') + q;
  }

  const headers: Record<string, string> = { accept: 'application/json' };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('网络请求失败，请检查后端服务是否可用');
  }

  let payload: ApiEnvelope | null = null;
  try {
    payload = (await res.json()) as ApiEnvelope;
  } catch {
    /* ignore */
  }

  if (res.status === 401) {
    clearToken();
    // 仅在非登录页时跳转
    if (!location.hash.includes('/login')) {
      const cur = location.hash.replace(/^#/, '') || '/';
      location.hash = `#/login?redirect=${encodeURIComponent(cur)}`;
    }
    throw new Error(payload?.message || '未登录或登录已过期');
  }

  if (!res.ok || (payload && payload.code && payload.code !== 0)) {
    throw new Error(payload?.message || `请求失败(${res.status})`);
  }
  return (payload ? payload.data : null) as T;
}

export const http = {
  get: <T>(path: string, params?: HttpParams): Promise<T> => request<T>(path, { params }),
  post: <T>(path: string, body: unknown): Promise<T> => request<T>(path, { method: 'POST', body })
};
