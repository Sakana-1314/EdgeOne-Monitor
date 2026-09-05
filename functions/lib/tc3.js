/**
 * functions/lib/tc3.js
 * 腾讯云 API 3.0 (TC3-HMAC-SHA256) 签名客户端，基于 WebCrypto + fetch，零第三方依赖，
 * 同时可在 边缘函数 / Pages Function / Node 环境运行。
 *
 * 参考: https://cloud.tencent.com/document/product/1278/85305
 */

import { sha256Hex, hmacSha256Hex, safeJsonParse } from './utils.js';

function canonicalHeaders(headerMap) {
  return Object.keys(headerMap)
    .sort()
    .map((k) => `${k.toLowerCase()}:${headerMap[k].trim()}\n`)
    .join('');
}

function signedHeaders(headerMap) {
  return Object.keys(headerMap)
    .sort()
    .map((k) => k.toLowerCase())
    .join(';');
}

/**
 * 计算 TC3 签名（可独立测试）。返回签名所需的各部分。
 */
export async function buildTC3({
  secretId,
  secretKey,
  action,
  params = {},
  version = '2022-09-01',
  host = 'teo.tencentcloudapi.com',
  region = 'ap-guangzhou',
  path = '/',
  now = new Date()
}) {
  const service = 'teo';
  const method = 'POST';
  const timestamp = Math.floor(now.getTime() / 1000);
  const date = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const payload = JSON.stringify(params);

  const headerMap = {
    'content-type': 'application/json; charset=utf-8',
    host,
    'x-tc-action': action.toLowerCase(),
    'x-tc-timestamp': String(timestamp),
    'x-tc-version': version,
    'x-tc-region': region
  };

  const hashedPayload = await sha256Hex(payload);
  const canonicalRequest = [
    method,
    path,
    '', // query 为空（参数放在 body）
    canonicalHeaders(headerMap),
    signedHeaders(headerMap),
    hashedPayload
  ].join('\n');

  const stringToSign = [
    'TC3-HMAC-SHA256',
    timestamp,
    `${date}/${service}/tc3_request`,
    await sha256Hex(canonicalRequest)
  ].join('\n');

  const secretDate = await hmacSha256Hex(`TC3${secretKey}`, date);
  const secretService = await hmacSha256Hex(secretDate, service);
  const secretSigning = await hmacSha256Hex(secretService, 'tc3_request');
  const signature = await hmacSha256Hex(secretSigning, stringToSign);

  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${date}/${service}/tc3_request, ` +
    `SignedHeaders=${signedHeaders(headerMap)}, Signature=${signature}`;

  return { timestamp, date, authorization, payload, headerMap };
}

/**
 * 对腾讯云 endpoint 发起一次 TC3 签名请求
 * @param {object}   env      { SECRET_ID, SECRET_KEY, TEO_ENDPOINT, TEO_REGION }
 * @param {string}   action   接口名，如 DescribeTimingL7AnalysisData
 * @param {object}   params   请求体
 * @param {object}   opts     { version, path, timeout, now }
 * @returns {Promise<any>}    返回 Response 里的业务字段（含 RequestId 等）
 */
export async function requestTC3(env, action, params = {}, opts = {}) {
  const secretId = env.SECRET_ID;
  const secretKey = env.SECRET_KEY;
  if (!secretId || !secretKey) {
    const err = new Error('缺少腾讯云凭据 SECRET_ID / SECRET_KEY');
    err.code = 'NO_CREDENTIAL';
    throw err;
  }

  const host = (env.TEO_ENDPOINT || 'teo.tencentcloudapi.com').replace(/^https?:\/\//, '');
  const { authorization, headerMap, payload } = await buildTC3({
    secretId,
    secretKey,
    action,
    params,
    version: opts.version,
    host,
    region: env.TEO_REGION,
    path: opts.path,
    now: opts.now
  });

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller && setTimeout(() => controller.abort(), opts.timeout || 15000);

  try {
    const res = await fetch(`https://${host}${path}`, {
      method,
      headers: {
        ...headerMap,
        Authorization: authorization
      },
      body: payload,
      signal: controller ? controller.signal : undefined
    });
    const text = await res.text();
    const data = safeJsonParse(text, {});
    if (!res.ok || data.Response?.Error) {
      const errMsg = data.Response?.Error?.Message || `HTTP ${res.status}`;
      const err = new Error(`腾讯云接口 ${action} 调用失败: ${errMsg}`);
      err.code = 'TC_ERROR';
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data.Response || data;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
