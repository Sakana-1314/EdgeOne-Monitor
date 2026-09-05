/**
* edge-functions/lib/jwt.js
 * HS256 JWT 签发 / 校验，零依赖，基于 WebCrypto。
 */

import { bytesToBase64Url, base64UrlToBytes, hmacSha256, safeEqualStr } from './utils.js';

function b64url(str) {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

/**
 * 签发 JWT
 * @param {string} secret
 * @param {object} payload  业务负载，会自动追加 iat/exp
 * @param {number} ttlDays  有效期（天）
 * @returns {Promise<string>}
 */
export async function signToken(secret, payload, ttlDays = 7) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body = {
    ...payload,
    iat: now,
    exp: now + ttlDays * 24 * 60 * 60,
    iss: 'edgeone-monitor',
    aud: 'edgeone-monitor-web'
  };
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(body));
  const sig = await hmacSha256(secret, `${h}.${p}`);
  return `${h}.${p}.${bytesToBase64Url(sig)}`;
}

/**
 * 校验 JWT 并返回负载；非法/过期返回 null
 */
export async function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;

  const expected = await hmacSha256(secret, `${h}.${p}`);
  const ok = await safeEqualStr(bytesToBase64Url(expected), s);
  if (!ok) return null;

  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(p)));
  } catch {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return null; // 过期
  if (payload.iat && payload.iat > now + 60) return null; // 未来的 token
  return payload;
}
