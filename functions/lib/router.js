/**
 * functions/lib/router.js
 * EdgeOne Pages Functions 后端路由（鉴权 + 数据接口）
 *
 * - 输入：标准 Web API Request + env（Pages 环境变量）
 * - 输出：标准 Response
 * - 仅使用 WebCrypto + fetch，运行于边缘函数（V8）运行时
 * - 数据源为腾讯云 EdgeOne 开放接口（TC3 签名直连），无演示/模拟模式
 */

import { signToken, verifyToken } from './jwt.js';
import { safeEqualStr, readJsonBody, formatUTCDate } from './utils.js';
import { isValidMetric, normalizeTime, normalizeInterval, KIND } from './registry.js';
import * as teo from './teo.js';

const VERSION = '2.1.0';
const DEFAULT_TTL_DAYS = 7;
const CRED_ENV_HINT = '请在 EdgeOne Pages 项目「环境变量」中配置 SECRET_ID / SECRET_KEY（需 QcloudTEOReadOnlyaccess 只读权限）';

function cfg(env) {
  const get = (k, d) => {
    const v = env?.[k];
    return v === undefined || v === null || v === '' ? d : String(v);
  };
  const hasCred = Boolean(env?.SECRET_ID && env?.SECRET_KEY);
  return {
    adminPassword: get('ADMIN_PASSWORD', ''),
    jwtSecret: get('JWT_SECRET', ''),
    ttlDays: Math.max(1, parseInt(get('TOKEN_TTL_DAYS', String(DEFAULT_TTL_DAYS)), 10) || DEFAULT_TTL_DAYS),
    siteName: get('SITE_NAME', 'EdgeOne 监控大屏'),
    siteIcon: get('SITE_ICON', ''),
    configured: hasCred,
    allowOrigins: get('ALLOW_ORIGINS', '*')
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

/** CORS 头 */
export function corsHeaders(request, allowOrigins) {
  const origin = request.headers.get('origin');
  const h = {
    'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type, authorization, x-requested-with',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
  if (origin) {
    const allowed = allowOrigins === '*' || allowOrigins.split(',').map((s) => s.trim()).includes(origin);
    if (allowed) {
      h['access-control-allow-origin'] = allowOrigins === '*' ? '*' : origin;
      h['access-control-allow-credentials'] = 'true';
    }
  }
  return h;
}

function bearer(request) {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

async function authenticate(env, request) {
  const c = cfg(env);
  const token = bearer(request);
  if (!token) return null;
  return verifyToken(token, c.jwtSecret);
}

function parseWindow(url) {
  const now = Date.now();
  const fallbackStart = formatUTCDate(new Date(now - 24 * 3600000));
  const fallbackEnd = formatUTCDate(new Date(now));

  const startRaw = url.searchParams.get('startTime') || url.searchParams.get('start');
  const endRaw = url.searchParams.get('endTime') || url.searchParams.get('end');
  const start = normalizeTime(startRaw, fallbackStart);
  const end = normalizeTime(endRaw, fallbackEnd);

  if (!start || !end || new Date(end).getTime() <= new Date(start).getTime()) {
    return { error: '时间范围无效：结束时间必须晚于开始时间' };
  }
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (endMs - startMs > 92 * 86400000) return { error: '时间范围不能超过 92 天' };

  return {
    start,
    end,
    startMs,
    endMs,
    interval: normalizeInterval(url.searchParams.get('interval') || 'auto'),
    zoneId: url.searchParams.get('zoneId') || '',
    zoneIds: (() => {
      const zoneId = url.searchParams.get('zoneId') || '';
      return zoneId && zoneId !== '*' ? [zoneId] : ['*'];
    })()
  };
}

/** 为时间类指标追加“上一周期”对比值（真实数据再查一次上一窗口） */
async function withCompare(env, results, opts, compare) {
  if (!compare) return results;
  const timeIds = Object.values(results)
    .filter((r) => r && r.kind === KIND.TIME)
    .map((r) => r.id);
  if (!timeIds.length) return results;

  const dur = opts.endMs - opts.startMs;
  const prevEndMs = opts.startMs;
  const prevOpts = {
    ...opts,
    start: formatUTCDate(new Date(prevEndMs - dur)),
    end: formatUTCDate(new Date(prevEndMs)),
    startMs: prevEndMs - dur,
    endMs: prevEndMs
  };
  let prev;
  try {
    prev = await teo.fetchMetrics(env, timeIds, prevOpts);
  } catch {
    return results;
  }
  for (const id of timeIds) {
    const p = prev[id];
    if (results[id] && p) {
      results[id].prevSum = p.sum;
      results[id].prevAvg = p.avg;
      if (p.max !== undefined) results[id].prevMax = p.max;
    }
  }
  return results;
}

function handleConfig(env) {
  const c = cfg(env);
  return json({
    code: 0,
    data: {
      siteName: c.siteName,
      siteIcon: c.siteIcon,
      version: VERSION,
      configured: c.configured,
      credentialHint: c.configured ? '' : CRED_ENV_HINT,
      time: formatUTCDate()
    }
  });
}

async function handleLogin(env, request) {
  const body = await readJsonBody(request);
  if (!body) return json({ code: 400, message: '请求体格式错误' }, 400);

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const c = cfg(env);

  if (!c.adminPassword || !c.jwtSecret) {
    return json(
      { code: 503, message: '服务未配置完整：缺少 ADMIN_PASSWORD 或 JWT_SECRET（请在 Pages 环境变量中配置）' },
      503
    );
  }

  // 账号固定 admin；密码由 ADMIN_PASSWORD 指定（常量时间比较）
  const userOk = await safeEqualStr(username, 'admin');
  const pwdOk = userOk ? await safeEqualStr(password, c.adminPassword) : false;
  if (!userOk || !pwdOk) {
    return json({ code: 401, message: '账号或密码错误' }, 401);
  }

  const token = await signToken(c.jwtSecret, { sub: 'admin', username: 'admin', role: 'admin' }, c.ttlDays);
  const payload = await verifyToken(token, c.jwtSecret);
  return json({
    code: 0,
    data: {
      token,
      tokenType: 'Bearer',
      expiresIn: c.ttlDays * 86400,
      expiresAt: payload.exp * 1000,
      user: { username: 'admin', name: 'admin' }
    }
  });
}

/** 依赖腾讯云凭据的接口统一错误返回 */
function noCredential() {
  return json({ code: 503, message: '未配置腾讯云凭据：' + CRED_ENV_HINT, hint: CRED_ENV_HINT }, 503);
}

async function handleZones(env) {
  if (!cfg(env).configured) return noCredential();
  try {
    const zones = await teo.listZones(env);
    return json({ code: 0, data: { zones } });
  } catch (e) {
    return json({ code: 502, message: e.message || '站点列表获取失败', detail: String(e) }, 502);
  }
}

async function handleMetrics(env, url) {
  if (!cfg(env).configured) return noCredential();

  const namesRaw = url.searchParams.get('names') || '';
  const names = namesRaw.split(',').map((s) => s.trim()).filter(Boolean).filter(isValidMetric);
  if (!names.length) {
    return json({ code: 400, message: '缺少合法的 names 指标参数' }, 400);
  }
  const win = parseWindow(url);
  if (win.error) return json({ code: 400, message: win.error }, 400);

  const compare = ['1', 'true', 'yes'].includes((url.searchParams.get('compare') || '').toLowerCase());
  try {
    let results = await teo.fetchMetrics(env, names, win);
    results = await withCompare(env, results, win, compare);
    return json({
      code: 0,
      data: {
        meta: { startTime: win.start, endTime: win.end, interval: win.interval, zoneId: win.zoneId || '*' },
        metrics: results
      }
    });
  } catch (e) {
    return json({ code: 502, message: e.message || '数据源请求失败', detail: String(e) }, 502);
  }
}

async function handlePages(env, url) {
  if (!cfg(env).configured) return noCredential();
  const which = url.pathname.split('/').pop();
  const zoneId = url.searchParams.get('zoneId') || '';
  try {
    if (which === 'build-count') {
      const r = await teo.fetchPagesBuild(env, zoneId);
      return json({ code: 0, data: r });
    }
    if (which === 'cf-requests') {
      const win = parseWindow(url);
      const r = await teo.fetchPagesCfRequests(env, zoneId, { start: win.start, end: win.end });
      return json({ code: 0, data: r });
    }
    if (which === 'cf-monthly') {
      const r = await teo.fetchPagesCfMonthly(env, zoneId);
      return json({ code: 0, data: r });
    }
  } catch (e) {
    return json({ code: 502, message: e.message || 'Pages 数据请求失败', detail: String(e) }, 502);
  }
  return json({ code: 404, message: '未知 Pages 接口' }, 404);
}

/**
 * 统一请求入口：CORS + 鉴权 + 路由
 * 由 functions/api/[[default]].js 的 onRequestGet / onRequestPost / onRequestOptions 调用
 */
export async function apiHandler(request, env = {}) {
  const c = cfg(env);

  // OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, c.allowOrigins) });
  }

  const cors = corsHeaders(request, c.allowOrigins);
  const withCors = (res) =>
    new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...cors } });

  const url = new URL(request.url);
  const path = url.pathname;

  // 健康检查
  if (path === '/api/health' || path === '/healthz') {
    return withCors(json({ code: 0, data: { ok: true, configured: c.configured, version: VERSION, time: formatUTCDate() } }));
  }

  if (!path.startsWith('/api/') && path !== '/api') {
    return withCors(json({ code: 404, message: 'Not Found' }, 404));
  }

  try {
    // 公开接口
    if (path === '/api/config') return withCors(handleConfig(env));
    if (path === '/api/auth/login' && request.method === 'POST') return withCors(await handleLogin(env, request));

    // 鉴权
    const payload = await authenticate(env, request);
    if (!payload) {
      return withCors(json({ code: 401, message: '未登录或登录已过期', hint: '请重新登录' }, 401));
    }

    if (path === '/api/auth/me') {
      return withCors(
        json({ code: 0, data: { user: { username: payload.username || 'admin' }, exp: payload.exp, iat: payload.iat } })
      );
    }
    if (path === '/api/zones' && request.method === 'GET') return withCors(await handleZones(env));
    if (path === '/api/metrics' && request.method === 'GET') return withCors(await handleMetrics(env, url));
    if (path.startsWith('/api/pages/')) {
      const allowed = ['build-count', 'cf-requests', 'cf-monthly'].includes(path.split('/').pop());
      if (allowed && request.method === 'GET') return withCors(await handlePages(env, url));
    }
    return withCors(json({ code: 404, message: '接口不存在' }, 404));
  } catch (e) {
    return withCors(json({ code: 500, message: e.message || '服务器内部错误', detail: String(e) }, 500));
  }
}

/** 兼容 Pages Function 的 EventContext 形式调用 */
export async function onRequest(context) {
  return apiHandler(context.request, context.env);
}
