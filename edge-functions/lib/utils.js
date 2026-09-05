/**
* edge-functions/lib/utils.js
 * 通用小工具：base64url / sha256 / HMAC —— 全部基于 WebCrypto，可运行于边缘函数与 Node 端。
 * 零第三方依赖。
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Uint8Array -> base64url 字符串 */
export function bytesToBase64Url(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** base64url 字符串 -> Uint8Array */
export function base64UrlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** utf-8 -> hex */
export function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 摘要 -> hex */
export async function sha256Hex(data) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return toHex(digest);
}

/** HMAC-SHA256 (key 可为 utf8 字符串或 Uint8Array 原始字节, data 为字符串) -> Uint8Array */
export async function hmacSha256(key, data) {
  const keyBytes = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  return new Uint8Array(sig);
}

/** HMAC-SHA256 -> hex */
export async function hmacSha256Hex(key, data) {
  return toHex(await hmacSha256(key, data));
}

/** 常量时间比较，防时序侧信道 */
export function timingSafeEqual(a, b) {
  const ba = typeof a === 'string' ? encoder.encode(a) : a;
  const bb = typeof b === 'string' ? encoder.encode(b) : b;
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

/** 安全的字符串常量时间比较 */
export async function safeEqualStr(a, b) {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/** 校验并返回 POST JSON body，非法返回 null */
export async function readJsonBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 生成 UTC 时间字符串（与 EdgeOne API 约定一致：YYYY-MM-DDTHH:mm:ssZ） */
export function formatUTCDate(date = new Date()) {
  return date.toISOString().slice(0, 19) + 'Z';
}
