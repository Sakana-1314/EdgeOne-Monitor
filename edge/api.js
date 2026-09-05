/**
 * edge/api.js —— 后端路由（登录鉴权 + 数据接口）
 * 纯 fetch/Response + WebCrypto，可在 边缘函数 / Pages Function / Node 本地环境运行。
 */

import { signToken, verifyToken } from './jwt.js';
import { safeEqualStr, readJsonBody, formatUTCDate, safeJsonParse } from './util.js';
import { isValidMetric, normalizeTime, normalizeInterval, METRIC, KIND } from './registry.js';
import { getProvider, resolveMode } from './provider.js';

const VERSION = '2.0.0';
const DEFAULT_TTL_DAYS = 7;

/** 从 env 读取配置并补默认值 */
function cfg(env) {
  const get = (k, d) => {
    const v = env?.[k];
    return v === undefined || v === null || v === '' ? d : String(v);
  };
  return {
    adminPassword: get('ADMIN_PASSWORD', 'admin'),
    jwtSecret: get('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
    ttlDays: Math.max(1, parseInt(get('TOKEN_TTL_DAYS', String(DEFAULT_TTL_DAYS)), 10) || DEFAULT_TTL_DAYS),
    siteName: get('SITE_NAME', 'EdgeOne 监控大屏'),
    siteIcon: get('SITE_ICON', ''),
    mode: resolveMode(env),
    allowOrigins: get('ALLOW_ORIGINS', '*')
  };
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

/** CORS 预检/跨域头（由 handleFetch 统一处理，非 /api 也保持幂等） */
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

/** 从 Authorization 取 token */
function bearer(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

/** 鉴权：校验成功返回 payload，否则返回 null */
async function auth(env, request) {
  const c = cfg(env);
  const token = bearer(request);
  if (!token) return null;
  return verifyToken(token, c.jwtSecret);
}

/** 时间范围与间隔解析 */
function parseWindow(url, defaultHours = 24) {
  const now = Date.now();
  const fallbackStart = formatUTCDate(new Date(now - defaultHours * 3600000));
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

  const interval = normalizeInterval(url.searchParams.get('interval') || 'auto');
  const zoneId = url.searchParams.get('zoneId') || '';
  const zoneIds = zoneId && zoneId !== '*' ? [zoneId] : ['*'];
  return { start, end, startMs, endMs, interval, zoneId, zoneIds };
}

/** 为时间类指标追加“上一周期”对比值 */
async function withCompare(env, results, opts, compare) {
  if (!compare) return results;
  const timeIds = Object.values(results)
    .filter((r) => r && r.kind === KIND.TIME)
    .map((r) => r.id);
  if (!timeIds.length) return results;

  const dur = opts.endMs - opts.startMs;
  const prevEndMs = opts.startMs;
  const prevStartMs = prevEndMs - dur;
  const prevOpts = {
    ...opts,
    start: formatUTCDate(new Date(prevStartMs)),
    end: formatUTCDate(new Date(prevEndMs)),
    startMs: prevStartMs,
    endMs: prevEndMs
  };
  const provider = getProvider(env);
  let prev;
  try {
    prev = await provider.fetchMetrics(env, timeIds, prevOpts);
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

async function handleConfig(env) {
  const c = cfg(env);
  return json({
    code: 0,
    data: {
      siteName: c.siteName,
      siteIcon: c.siteIcon,
      version: VERSION,
      mode: c.mode,
      demo: c.mode === 'mock',
      auth: { username: 'admin' },
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

  // 固定账号 admin；密码由 ADMIN_PASSWORD 指定（常量时间比较）
  const userOk = await safeEqualStr(username, 'admin');
  const pwdOk = username === 'admin' ? await safeEqualStr(password, c.adminPassword) : false;
  if (!userOk || !pwdOk) {
    return json({ code: 401, message: '账号或密码错误' }, 401);
  }

  const token = await signToken(
    c.jwtSecret,
    { sub: 'admin', username: 'admin', role: 'admin' },
    c.ttlDays
  );
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

async function handleZones(env, request) {
  const provider = getProvider(env);
  const zones = await provider.listZones(env);
  return json({ code: 0, data: { mode: cfg(env).mode, zones } });
}

async function handleMetrics(env, request, url) {
  const namesRaw = url.searchParams.get('names') || url.searchParams.get('name') || '';
  const names = namesRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter(isValidMetric);
  if (!names.length) {
    return json({ code: 400, message: '缺少合法的 names 指标参数' }, 400);
  }

  const win = parseWindow(url);
  if (win.error) return json({ code: 400, message: win.error }, 400);

  const compare = ['1', 'true', 'yes'].includes((url.searchParams.get('compare') || '').toLowerCase());
  const provider = getProvider(env);

  let results;
  try {
    results = await provider.fetchMetrics(env, names, win);
  } catch (e) {
    return json({ code: 500, message: e.message || '数据源请求失败', detail: String(e) }, 502);
  }
  results = await withCompare(env, results, win, compare);

  return json({
    code: 0,
    data: {
      meta: {
        mode: cfg(env).mode,
        startTime: win.start,
        endTime: win.end,
        interval: win.interval,
        zoneId: win.zoneId || '*'
      },
      metrics: results
    }
  });
}

async function handlePages(env, request, url) {
  const which = url.pathname.split('/').pop();
  const zoneId = url.searchParams.get('zoneId') || '';
  const provider = getProvider(env);
  const base = { mode: cfg(env).mode };

  try {
    if (which === 'build-count') {
      const r = await provider.fetchPagesBuild(env, zoneId);
      return json({ code: 0, data: { ...base, ...r } });
    }
    if (which === 'cf-requests') {
      const win = parseWindow(url, 24);
      const r = await provider.fetchPagesCfRequests(env, zoneId, win);
      return json({ code: 0, data: { ...base, ...r } });
    }
    if (which === 'cf-monthly') {
      const r = await provider.fetchPagesCfMonthly(env, zoneId);
      return json({ code: 0, data: { ...base, ...r } });
    }
  } catch (e) {
    return json({ code: 502, message: e.message || 'Pages 数据请求失败', detail: String(e) }, 502);
  }
  return json({ code: 404, message: '未知 Pages 接口' }, 404);
}

/**
 * 统一入口：CORS + 鉴权 + 路由
 * 可被 边缘函数(export default {fetch}) / Pages Function(onRequest) / 本地 Node 复用。
 */
export async function handleFetch(request, env = {}) {
  const c = cfg(env);
  const url = new URL(request.url);

  // 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, c.allowOrigins) });
  }

  const cors = corsHeaders(request, c.allowOrigins);
  const withCors = (res) => {
    const r = new Response(res.body, { status: res.status, headers: { ...Object.fromEntries(res.headers), ...cors } });
    return r;
  };

  const path = url.pathname;

  // 健康检查 / 非 /api 一律 404（静态资源由平台或本地静态服务处理）
  if (path === '/api/health' || path === '/healthz') {
    return withCors(json({ code: 0, data: { ok: true, mode: c.mode, time: formatUTCDate() } }));
  }

  if (!path.startsWith('/api/') && path !== '/api') {
    return withCors(json({ code: 404, message: 'Not Found' }, 404));
  }

  try {
    // 无需鉴权
    if (path === '/api/config') return withCors(await handleConfig(env));
    if (path === '/api/auth/login' && request.method === 'POST') return withCors(await handleLogin(env, request));

    // 其余需鉴权
    const payload = await auth(env, request);
    if (!payload) {
      return withCors(json({ code: 401, message: '未登录或登录已过期', hint: '请重新登录' }, 401));
    }

    if (path === '/api/auth/me') {
      return withCors(json({ code: 0, data: { user: { username: payload.username || 'admin' }, exp: payload.exp, iat: payload.iat } }));
    }
    if (path === '/api/zones' && request.method === 'GET') return withCors(await handleZones(env, request));
    if (path === '/api/metrics' && request.method === 'GET') return withCors(await handleMetrics(env, request, url));

    if (path.startsWith('/api/pages/')) {
      const allowed = ['build-count', 'cf-requests', 'cf-monthly'].includes(path.split('/').pop());
      if (allowed && request.method === 'GET') return withCors(await handlePages(env, request, url));
    }

    return withCors(json({ code: 404, message: '接口不存在' }, 404));
  } catch (e) {
    return withCors(json({ code: 500, message: e.message || '服务器内部错误', detail: String(e) }, 500));
  }
}

/** 便于边缘函数默认导出 */
export default { fetch: handleFetch };
