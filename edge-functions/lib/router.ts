/**
 * edge-functions/lib/router.ts
 * EdgeOne Edge Functions 后端路由（鉴权 + 数据接口 + 站点/域名白名单）
 *
 * - 输入：标准 Web API Request + env（Edge Functions 环境变量）
 * - 输出：标准 Response；数据源为腾讯云 EdgeOne 开放接口（TC3 签名直连）
 * - 站点限制：ALLOWED_ZONE_IDS（空 = 不限），未授权站点请求返回 403
 */

import { signToken, verifyToken } from './jwt.ts';
import { safeEqualStr, readJsonBody, formatUTCDate, errorMessage } from './utils.ts';
import { isValidMetric, normalizeTime, normalizeInterval, KIND } from './registry.ts';
import { allowedZones } from './allowlist.ts';
import * as teo from './teo.ts';
import type {
  Env,
  JwtClaims,
  TimeMetricResult,
  MetricsMap,
  TimeWindow,
  ParseWindowResult
} from './types.ts';

const VERSION = '2.2.0';
const DEFAULT_TTL_DAYS = 7;

/** 由环境变量归一化得到的应用配置 */
interface AppConfig {
  adminPassword: string;
  jwtSecret: string;
  ttlDays: number;
  siteName: string;
  siteIcon: string;
  configured: boolean;
  allowOrigins: string;
}

function cfg(env: Env): AppConfig {
  const get = (k: string, d: string): string => {
    const v: unknown = env[k];
    return v === undefined || v === null || v === '' ? d : String(v);
  };
  const hasCred = Boolean(env.SECRET_ID && env.SECRET_KEY);
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

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });

/** CORS 头 */
export function corsHeaders(request: Request, allowOrigins: string): Record<string, string> {
  const origin = request.headers.get('origin');
  const h: Record<string, string> = {
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

function bearer(request: Request): string {
  const auth = request.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

async function authenticate(env: Env, request: Request): Promise<JwtClaims | null> {
  const c = cfg(env);
  const token = bearer(request);
  if (!token) return null;
  return verifyToken(token, c.jwtSecret);
}

function parseWindow(url: URL): ParseWindowResult {
  const now = Date.now();
  const fallbackStart = formatUTCDate(new Date(now - 24 * 3600000));
  const fallbackEnd = formatUTCDate(new Date(now));

  const startRaw = url.searchParams.get('startTime') || url.searchParams.get('start');
  const endRaw = url.searchParams.get('endTime') || url.searchParams.get('end');
  const start = normalizeTime(startRaw, fallbackStart);
  const end = normalizeTime(endRaw, fallbackEnd);

  if (!start || !end || new Date(end).getTime() <= new Date(start).getTime()) {
    return { ok: false, error: '时间范围无效：结束时间必须晚于开始时间' };
  }
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (endMs - startMs > 92 * 86400000) return { ok: false, error: '时间范围不能超过 92 天' };

  return {
    ok: true,
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
async function withCompare(
  env: Env,
  results: MetricsMap,
  opts: TimeWindow,
  compare: boolean
): Promise<MetricsMap> {
  if (!compare) return results;
  const timeIds = Object.values(results)
    .filter((r): r is TimeMetricResult => r != null && r.kind === KIND.TIME)
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
  let prev: MetricsMap;
  try {
    prev = await teo.fetchMetrics(env, timeIds, prevOpts);
  } catch {
    return results;
  }
  for (const id of timeIds) {
    const cur = results[id];
    const prevRes = prev[id];
    if (cur && prevRes && cur.kind === KIND.TIME && prevRes.kind === KIND.TIME) {
      cur.prevSum = prevRes.sum;
      cur.prevAvg = prevRes.avg;
      if (prevRes.max !== undefined) cur.prevMax = prevRes.max;
    }
  }
  return results;
}

function handleConfig(env: Env): Response {
  const c = cfg(env);
  return json({
    code: 0,
    data: {
      siteName: c.siteName,
      siteIcon: c.siteIcon,
      version: VERSION,
      configured: c.configured,
      time: formatUTCDate()
    }
  });
}

async function handleLogin(env: Env, request: Request): Promise<Response> {
  const body: unknown = await readJsonBody(request);
  if (!body) return json({ code: 400, message: '请求体格式错误' }, 400);

  const rec = body as Record<string, unknown>;
  const username = String(rec.username || '').trim();
  const password = String(rec.password || '');
  const c = cfg(env);

  if (!c.adminPassword || !c.jwtSecret) {
    return json(
      { code: 503, message: '服务初始化未完成，请联系管理员' },
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
      expiresAt: payload!.exp! * 1000,
      user: { username: 'admin', name: 'admin' }
    }
  });
}

/** 依赖腾讯云凭据的接口统一错误返回（对外不暴露部署细节） */
function noCredential(): Response {
  return json({ code: 503, message: '数据服务暂未就绪，请稍后重试' }, 503);
}

function forbiddenZone(_zone?: string): Response {
  return json({ code: 403, message: '该站点不在允许监控的范围内', hint: '如需开通请联系管理员' }, 403);
}

/** authorizeZones 的返回 */
type ZoneAuthz =
  | { ok: true; zones: string[] }
  | { ok: false; zones: string[]; forbidden: string };

/**
 * 站点白名单强制解析：
 * - 白名单为空 -> 维持原请求（'*' 表示全账号）
 * - 白名单非空 -> '*' 展开为白名单站点；显式站点必须命中白名单，否则返回错误
 */
function authorizeZones(env: Env, requestedZoneIds: string[]): ZoneAuthz {
  const allowed = allowedZones(env);
  if (!allowed.length) {
    const hasStar = requestedZoneIds.some((z) => z === '*');
    return { ok: true, zones: hasStar ? ['*'] : [...requestedZoneIds] };
  }
  const out: string[] = [];
  for (const z of requestedZoneIds) {
    if (z === '*') out.push(...allowed);
    else if (allowed.includes(z)) out.push(z);
    else return { ok: false, forbidden: z, zones: [] };
  }
  return { ok: true, zones: [...new Set(out)] };
}

async function handleZones(env: Env): Promise<Response> {
  if (!cfg(env).configured) return noCredential();
  try {
    const zones = await teo.listZones(env, allowedZones(env));
    return json({ code: 0, data: { zones } });
  } catch (e: unknown) {
    return json({ code: 502, message: errorMessage(e) || '站点列表获取失败', detail: String(e) }, 502);
  }
}

async function handleMetrics(env: Env, url: URL): Promise<Response> {
  if (!cfg(env).configured) return noCredential();

  const namesRaw = url.searchParams.get('names') || '';
  const names = namesRaw.split(',').map((s) => s.trim()).filter(Boolean).filter(isValidMetric);
  if (!names.length) {
    return json({ code: 400, message: '缺少合法的 names 指标参数' }, 400);
  }
  const win = parseWindow(url);
  if (!win.ok) return json({ code: 400, message: win.error }, 400);

  // 站点白名单强制
  const authz = authorizeZones(env, win.zoneIds);
  if (!authz.ok) return forbiddenZone(authz.forbidden);
  win.zoneIds = authz.zones;

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
  } catch (e: unknown) {
    return json({ code: 502, message: errorMessage(e) || '数据源请求失败', detail: String(e) }, 502);
  }
}

async function handlePages(env: Env, url: URL): Promise<Response> {
  if (!cfg(env).configured) return noCredential();
  const which = url.pathname.split('/').pop();
  const zoneId = url.searchParams.get('zoneId') || '';
  const allowed = allowedZones(env);

  // 站点白名单强制（显式指定站点时必须命中白名单）
  if (zoneId && zoneId !== '*' && allowed.length && !allowed.includes(zoneId)) {
    return forbiddenZone(zoneId);
  }
  try {
    if (which === 'build-count') {
      const r = await teo.fetchPagesBuild(env, zoneId, allowed);
      return json({ code: 0, data: r });
    }
    if (which === 'cf-requests') {
      const win = parseWindow(url);
      const r = await teo.fetchPagesCfRequests(
        env,
        zoneId,
        { start: win.ok ? win.start : undefined, end: win.ok ? win.end : undefined },
        allowed
      );
      return json({ code: 0, data: r });
    }
    if (which === 'cf-monthly') {
      const r = await teo.fetchPagesCfMonthly(env, zoneId, allowed);
      return json({ code: 0, data: r });
    }
  } catch (e: unknown) {
    return json({ code: 502, message: errorMessage(e) || 'Pages 数据请求失败', detail: String(e) }, 502);
  }
  return json({ code: 404, message: '未知 Pages 接口' }, 404);
}

/**
 * 统一请求入口：CORS + 鉴权 + 路由
 * 由 edge-functions/api/[[default]].ts 的 onRequestGet / onRequestPost / onRequestOptions 调用
 */
export async function apiHandler(request: Request, env: Env = {}): Promise<Response> {
  const c = cfg(env);

  // OPTIONS 预检
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, c.allowOrigins) });
  }

  const cors = corsHeaders(request, c.allowOrigins);
  const withCors = (res: Response): Response =>
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
      const allowed = ['build-count', 'cf-requests', 'cf-monthly'].includes(path.split('/').pop() || '');
      if (allowed && request.method === 'GET') return withCors(await handlePages(env, url));
    }
    return withCors(json({ code: 404, message: '接口不存在' }, 404));
  } catch (e: unknown) {
    return withCors(json({ code: 500, message: errorMessage(e) || '服务器内部错误', detail: String(e) }, 500));
  }
}

/** 兼容 Pages Function 的 EventContext 形式调用 */
export async function onRequest(context: { request: Request; env: Env }): Promise<Response> {
  return apiHandler(context.request, context.env);
}
