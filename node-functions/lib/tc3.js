/**
 * node-functions/lib/tc3.js
 * 腾讯云 API 3.0 (TC3-HMAC-SHA256) 签名客户端，基于 WebCrypto + fetch，零第三方依赖，
 * 同时可在 Node Functions / 边缘函数 / Node 环境运行。
 *
 * 签名方式与腾讯云官方 SDK (sign3) 保持一致：
 *   - HTTP POST，参数放 JSON body
 *   - 仅对 content-type 与 host 两个头签名（其余 X-TC-* 头不参与签名）
 *   - X-TC-Action 需保留原始大小写（如 DescribeZones），小写会被服务端拒绝
 * 参考: https://cloud.tencent.com/document/product/1278/85305
 */

import { sha256Hex, hmacSha256, toHex, safeJsonParse } from './utils.js';

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

  const contentType = 'application/json';
  const headerMap = {
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

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller && setTimeout(() => controller.abort(), opts.timeout || 15000);

  try {
    const res = await fetch(`https://${host}${apiPath}`, {
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
