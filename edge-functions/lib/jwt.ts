/**
 * edge-functions/lib/jwt.ts
 * HS256 JWT 签发 / 校验，零依赖，基于 WebCrypto。
 */

import { bytesToBase64Url, base64UrlToBytes, hmacSha256, safeEqualStr } from './utils.ts';
import type { JwtClaims } from './types.ts';

function b64url(str: string): string {
  return bytesToBase64Url(new TextEncoder().encode(str));
}

/** 把 base64url 的 JSON 负载安全解析为对象负载；非对象（含解析失败）返回 null */
function parseClaimsPayload(payloadB64: string): JwtClaims | null {
  try {
    const decoded: unknown = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadB64)));
    if (typeof decoded === 'object' && decoded !== null) return decoded as JwtClaims;
    return null;
  } catch {
    return null;
  }
}

/**
 * 签发 JWT
 * @param secret  签名密钥
 * @param payload 业务负载，会自动追加 iat/exp/iss/aud
 * @param ttlDays 有效期（天）
 */
export async function signToken(secret: string, payload: Record<string, unknown>, ttlDays = 7): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const body: Record<string, unknown> = {
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
export async function verifyToken(token: string, secret: string): Promise<JwtClaims | null> {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;

  const expected = await hmacSha256(secret, `${h}.${p}`);
  const ok = await safeEqualStr(bytesToBase64Url(expected), s);
  if (!ok) return null;

  const payload = parseClaimsPayload(p);
  if (!payload) return null;

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) return null; // 过期
  if (payload.iat && payload.iat > now + 60) return null; // 未来的 token
  return payload;
}
