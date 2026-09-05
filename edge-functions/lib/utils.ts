/**
 * edge-functions/lib/utils.ts
 * 通用小工具：base64url / sha256 / HMAC —— 全部基于 WebCrypto，可运行于边缘函数与 Node 端。
 * 零第三方依赖。
 */

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Uint8Array -> base64url 字符串 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk) as unknown as number[]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/** base64url 字符串 -> Uint8Array */
export function base64UrlToBytes(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const bin = atob(b64 + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** utf-8 / 原始字节 -> hex */
export function toHex(buf: ArrayBuffer | Uint8Array): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** SHA-256 摘要 -> hex */
export async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return toHex(digest);
}

/** HMAC-SHA256（key 可为 utf8 字符串或 Uint8Array 原始字节, data 为字符串）-> Uint8Array */
export async function hmacSha256(key: string | Uint8Array, data: string): Promise<Uint8Array> {
  // 统一转成 ArrayBuffer 承载的字节视图，满足 WebCrypto BufferSource 的类型约束
  const keyBytes = typeof key === 'string' ? encoder.encode(key) : new Uint8Array(key);
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
export async function hmacSha256Hex(key: string | Uint8Array, data: string): Promise<string> {
  return toHex(await hmacSha256(key, data));
}

/** 常量时间比较，防时序侧信道 */
export function timingSafeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
  const ba = typeof a === 'string' ? encoder.encode(a) : a;
  const bb = typeof b === 'string' ? encoder.encode(b) : b;
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

/** 安全的字符串常量时间比较 */
export async function safeEqualStr(a: string, b: string): Promise<boolean> {
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** 通用 JSON 安全解析：解析失败返回 fallback */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/** 读取并校验 POST JSON body（返回 unknown，调用侧自行收窄为对象） */
export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    const text = await request.text();
    if (!text) return {};
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** 生成 UTC 时间字符串（与 EdgeOne API 约定一致：YYYY-MM-DDTHH:mm:ssZ） */
export function formatUTCDate(date: Date = new Date()): string {
  return date.toISOString().slice(0, 19) + 'Z';
}

/** 从 catch 到的未知值中提取错误消息（仅当其为标准 Error 时；否则视为无消息） */
export function errorMessage(e: unknown): string | undefined {
  return e instanceof Error ? e.message : undefined;
}
