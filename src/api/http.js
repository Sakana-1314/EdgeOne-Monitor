/**
 * src/api/http.js —— 带鉴权的 fetch 封装
 * 401 自动清理凭证并跳转登录页
 */

const TOKEN_KEY = 'eo_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
export function setToken(t) {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, { method = 'GET', body, params } = {}) {
  let url = path;
  if (params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    const q = qs.toString();
    url += (url.includes('?') ? '&' : '?') + q;
  }

  const headers = { accept: 'application/json' };
  const token = getToken();
  if (token) headers.authorization = `Bearer ${token}`;
  if (body) headers['content-type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch (e) {
    throw new Error('网络请求失败，请检查后端服务是否可用');
  }

  let payload = null;
  try {
    payload = await res.json();
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
  return payload ? payload.data : null;
}

export const http = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body })
};
