/**
 * edge-functions/lib/tc3.ts
 * 腾讯云 API 3.0 (TC3-HMAC-SHA256) 签名客户端，基于 WebCrypto + fetch，零第三方依赖，
 * 同时可在 Edge Functions / 边缘函数 / Node 环境运行。
 *
 * 签名方式与腾讯云官方 SDK (sign3) 保持一致：
 *   - HTTP POST，参数放 JSON body
 *   - 仅对 content-type 与 host 两个头签名（其余 X-TC-* 头不参与签名）
 *   - X-TC-Action 需保留原始大小写（如 DescribeZones），小写会被服务端拒绝
 * 参考: https://cloud.tencent.com/document/product/1278/85305
 */

import { sha256Hex, hmacSha256, toHex, safeJsonParse } from './utils.ts';
import type { Env } from './types.ts';

/** buildTC3 入参 */
export interface BuildTC3Params {
  secretId: string;
  secretKey: string;
  action: string;
  params?: Record<string, unknown>;
  version?: string;
  host?: string;
  region?: string;
  path?: string;
  now?: Date;
}

/** buildTC3 返回的签名所需各部分 */
export interface BuildTC3Result {
  timestamp: number;
  date: string;
  authorization: string;
  payload: string;
  headerMap: Record<string, string>;
}

/** requestTC3 可选参数 */
export interface RequestTC3Options {
  version?: string;
  path?: string;
  timeout?: number;
  now?: Date;
}

/** TC3 错误体（Error 段） */
export interface TC3Error {
  Code?: string;
  Message?: string;
}

/** TC3 单条 Response（业务键不定，统一按 Record 访问） */
export interface TC3Response extends Record<string, unknown> {
  Error?: TC3Error;
  RequestId?: string;
}

/** TC3 顶层返回包 */
export interface TC3Envelope extends Record<string, unknown> {
  Response?: TC3Response;
}

/** 携带附加错误信息的运行时错误 */
export interface TC3RuntimeError extends Error {
  code?: string;
  status?: number;
  data?: unknown;
}

/**
 * 计算 TC3 签名（可独立测试）。返回签名所需的各部分。
 */
export async function buildTC3(params: BuildTC3Params): Promise<BuildTC3Result> {
  const {
    secretId,
    secretKey,
    action,
    params: reqParams = {},
    version = '2022-09-01',
    host = 'teo.tencentcloudapi.com',
    region = 'ap-guangzhou',
    path = '/',
    now = new Date()
  } = params;

  const service = 'teo';
  const method = 'POST';
  const timestamp = Math.floor(now.getTime() / 1000);
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const payload = JSON.stringify(reqParams);

  const contentType = 'application/json';
  const headerMap: Record<string, string> = {
    'content-type': contentType,
    host,
    // 注意：action 需保留原始大小写（如 DescribeZones），小写会被服务端拒绝
    'x-tc-action': action,
    'x-tc-timestamp': String(timestamp),
    'x-tc-version': version,
    'x-tc-region': region
  };

  // 仅对 content-type 与 host 签名（与官方 SDK 一致）
  const signedHeaderNames = 'content-type;host';
  const signedHeaderLines = `content-type:${contentType}\nhost:${host}\n`;

  const hashedPayload = await sha256Hex(payload);
  const canonicalRequest = [
    method,
    path,
    '', // query 为空（参数放在 body）
    signedHeaderLines,
    signedHeaderNames,
    hashedPayload
  ].join('\n');

  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    `${date}/${service}/tc3_request`,
    await sha256Hex(canonicalRequest)
  ].join('\n');

  // 注意：链式 HMAC 需以「上一级 HMAC 的原始字节」作为下一级密钥（与官方 SDK 一致），
  // 不能用其十六进制字符串，否则签名会被服务端拒绝。
  const secretDate = await hmacSha256(`TC3${secretKey}`, date);
  const secretService = await hmacSha256(secretDate, service);
  const secretSigning = await hmacSha256(secretService, 'tc3_request');
  const signature = await hmacSha256(secretSigning, stringToSign);
  const signatureHex = toHex(signature);

  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, ` +
    `SignedHeaders=${signedHeaderNames}, Signature=${signatureHex}`;

  return { timestamp, date, authorization, payload, headerMap };
}

/**
 * 对腾讯云 endpoint 发起一次 TC3 签名请求
 * @param env    { SECRET_ID, SECRET_KEY, TEO_ENDPOINT, TEO_REGION }
 * @param action 接口名，如 DescribeTimingL7AnalysisData
 * @param params 请求体
 * @param opts   { version, path, timeout, now }
 * @returns 业务数据（Record，键视接口而定），失败时抛 TC3RuntimeError
 */
export async function requestTC3(
  env: Env,
  action: string,
  params: Record<string, unknown> = {},
  opts: RequestTC3Options = {}
): Promise<Record<string, unknown>> {
  const secretId = env.SECRET_ID;
  const secretKey = env.SECRET_KEY;
  if (!secretId || !secretKey) {
    const err = new Error('缺少腾讯云凭据 SECRET_ID / SECRET_KEY') as TC3RuntimeError;
    err.code = 'NO_CREDENTIAL';
    throw err;
  }

  const host = (env.TEO_ENDPOINT || 'teo.tencentcloudapi.com').replace(/^https?:\/\//, '');
  const method = 'POST';
  const apiPath = opts.path || '/';
  const { authorization, headerMap, payload } = await buildTC3({
    secretId,
    secretKey,
    action,
    params,
    version: opts.version,
    host,
    region: env.TEO_REGION,
    path: apiPath,
    now: opts.now
  });

  // Edge Functions (V8) 运行时更建议用 AbortSignal.timeout，避免依赖定时器
  const timeoutMs = opts.timeout || 15000;
  const timeoutSignal =
    typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
      ? AbortSignal.timeout(timeoutMs)
      : null;

  const res = await fetch(`https://${host}${apiPath}`, {
    method,
    headers: {
      ...headerMap,
      Authorization: authorization
    },
    body: payload,
    signal: timeoutSignal || undefined
  });
  const text = await res.text();
  const data = safeJsonParse<TC3Envelope>(text, {} as TC3Envelope);
  if (!res.ok || data.Response?.Error) {
    const errMsg = data.Response?.Error?.Message || `HTTP ${res.status}`;
    const err = new Error(`腾讯云接口 ${action} 调用失败: ${errMsg}`) as TC3RuntimeError;
    err.code = 'TC_ERROR';
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data.Response || data;
}
