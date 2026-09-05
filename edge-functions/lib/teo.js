/**
* edge-functions/lib/teo.js —— 腾讯云 EdgeOne 数据接口封装（TC3 签名直连）
 * 基于 fetch + TC3 签名直连 EdgeOne 开放接口，可运行于边缘函数 / Pages Function / Node。
 *
 * 说明：真实模式需要环境变量 SECRET_ID / SECRET_KEY（仅需 EdgeOne 只读权限）。
 * 所有方法均返回“已归一化”的结构，供 Pages Functions 路由直接使用。
 */

import { requestTC3 } from './tc3.js';
import { SOURCE, sourceOf, KIND } from './registry.js';

/** 找到一次时序接口返回中指定指标的那一组 */
function findMetricBlock(response, metricId, { listKey = 'Data' } = {}) {
  // 注意：回源接口(DescribeTimingL7OriginPullData)把记录放在顶层 TimingDataRecords，
  // 其余时序接口放在 Data 下。统一按 listKey 取值，再兼容兜底。
  let arr = response?.[listKey];
  if (!Array.isArray(arr)) {
    arr = Array.isArray(response?.Data)
      ? response.Data
      : Array.isArray(response?.TimingDataRecords)
        ? response.TimingDataRecords
        : [response];
  }
  const dataArr = arr;
  for (const block of dataArr) {
    if (!block || typeof block !== 'object') continue;
    // 某些接口直接返回 TypeValue / Value 数组
    for (const key of ['TypeValue', 'Value']) {
      const arr = block[key];
      if (Array.isArray(arr)) {
        const hit = arr.find((m) => m && (m.MetricName === metricId || m.Metric === metricId));
        if (hit) return hit;
      }
    }
    if (block.MetricName === metricId || block.Metric === metricId) return block;
  }
  // fallback: 返回第一组（用于单指标接口）
  for (const key of ['TypeValue', 'Value']) {
    const arr = dataArr[0]?.[key];
    if (Array.isArray(arr) && arr.length) return arr[0];
  }
  return null;
}

function pickNum(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** 将一次时序返回中的单个指标归一化 */
function normalizeTimeBlock(block, metricId) {
  const detail = Array.isArray(block?.Detail) ? block.Detail : [];
  const points = [];
  for (const item of detail) {
    const t = item.Timestamp || item.Time || item.DateTime;
    const v = Number(item.Value);
    if (t == null || !Number.isFinite(v)) continue;
    points.push({ t: Number(t) * 1000, v }); // 秒 -> 毫秒
  }
  const sum = pickNum(block?.Sum);
  const max = pickNum(block?.Max);
  const avg = pickNum(block?.Avg);
  return {
    id: metricId,
    kind: KIND.TIME,
    points,
    sum: sum || points.reduce((a, p) => a + p.v, 0),
    max: max || points.reduce((a, p) => Math.max(a, p.v), 0),
    avg: avg || (points.length ? sum / points.length : 0)
  };
}

/** 将一次 TOP 返回归一化 */
function normalizeTopResponse(response, metricId) {
  const raw = response?.Data?.[0]?.DetailData || response?.TopData || [];
  const data = raw.map((d) => ({ key: String(d.Key ?? ''), value: Number(d.Value) || 0 }));
  return { id: metricId, kind: KIND.TOP, data };
}

function buildBaseParams({ start, end, interval, zoneIds }) {
  const p = { StartTime: start, EndTime: end, ZoneIds: zoneIds };
  if (interval && interval !== 'auto') p.Interval = interval;
  return p;
}

/** 分组批量拉取指标（时间类按接口合并，TOP 类逐条拉取） */
export async function fetchMetrics(env, ids, opts) {
  const results = {};
  const timeBySource = {};
  const topIds = [];

  for (const id of ids) {
    const s = sourceOf(id);
    if (s === SOURCE.TOP) topIds.push(id);
    else (timeBySource[s] ||= []).push(id);
  }

  await Promise.all(
    topIds.map(async (id) => {
      try {
        const res = await requestTC3(env, 'DescribeTopL7AnalysisData', {
          StartTime: opts.start,
          EndTime: opts.end,
          MetricName: id,
          ZoneIds: opts.zoneIds
        });
        results[id] = normalizeTopResponse(res, id);
      } catch (e) {
        results[id] = { id, kind: KIND.TOP, data: [], error: e.message };
      }
    })
  );

  const ACTION = {
    [SOURCE.TIMING]: 'DescribeTimingL7AnalysisData',
    [SOURCE.ORIGIN]: 'DescribeTimingL7OriginPullData',
    [SOURCE.SECURITY]: 'DescribeWebProtectionData',
    [SOURCE.FUNCTIONS]: 'DescribeTimingFunctionAnalysisData'
  };

  for (const [src, names] of Object.entries(timeBySource)) {
    const action = ACTION[src];
    if (!action) continue;
    const params = { ...buildBaseParams(opts), MetricNames: names };
    try {
      const res = await requestTC3(env, action, params);
      const listKey = src === SOURCE.ORIGIN ? 'TimingDataRecords' : 'Data';
      for (const id of names) {
        const block = findMetricBlock(res, id, { listKey });
        results[id] = block ? normalizeTimeBlock(block, id) : { id, kind: KIND.TIME, points: [], sum: 0, max: 0, avg: 0 };
      }
    } catch (e) {
      for (const id of names) {
        results[id] = { id, kind: KIND.TIME, points: [], sum: 0, max: 0, avg: 0, error: e.message };
      }
    }
  }
  return results;
}

/** 站点列表（allowed 为空数组/未传 = 全部；非空时仅返回白名单内站点） */
export async function listZones(env, allowed = null) {
  const res = await requestTC3(env, 'DescribeZones', {});
  const zones = Array.isArray(res?.Zones) ? res.Zones : [];
  let list = zones
    .map((z) => ({
      id: z.ZoneId,
      name: z.ZoneName === 'default-pages-zone' ? `${z.ZoneName} (Pages站点)` : z.ZoneName,
      area: z.ZoneType || z.Area || ''
    }))
    .sort((a, b) => (a.name === 'default-pages-zone (Pages站点)' ? -1 : a.name.localeCompare(b.name)));
  if (allowed && allowed.length) {
    const set = new Set(allowed);
    list = list.filter((z) => set.has(z.id));
  }
  return list;
}

async function discoverPagesZone(env, zoneId, allowed = null) {
  if (zoneId && zoneId !== '*') return zoneId;
  try {
    const zones = await listZones(env, allowed);
    const pages = zones.find((z) => z.name.includes('Pages'));
    if (pages) return pages.id;
    if (zones.length) return zones[0].id;
  } catch {
    /* ignore */
  }
  return zoneId;
}

async function callPagesInterface(env, zoneId, iface, payload, allowed = null) {
  const target = await discoverPagesZone(env, zoneId, allowed);
  if (!target) throw new Error('未找到可用的 Pages 站点，请检查 ALLOWED_ZONE_IDS 或指定 zoneId');
  const res = await requestTC3(env, 'DescribePagesResources', {
    ZoneId: target,
    Interface: iface,
    Payload: typeof payload === 'string' ? payload : JSON.stringify(payload || {})
  });
  return res;
}

/** 解析 Result 字符串（Pages 内部接口返回 JSON 字符串） */
function parsePagesResult(res) {
  const raw = typeof res?.Result === 'string' ? res.Result : null;
  if (raw) {
    try {
      return { ...res, parsedResult: JSON.parse(raw) };
    } catch {
      return { ...res, parsedResult: null };
    }
  }
  return res;
}

const findNum = (...keys) => {
  for (const k of keys) {
    if (k != null) return k;
  }
  return 0;
};

/** Pages 构建统计 */
export async function fetchPagesBuild(env, zoneId, allowed = null) {
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribePagesDeploymentUsage', '{}', allowed)
  );
  const p = res.parsedResult || res;
  // 尽力解析（真实返回结构以腾讯云为准，容错处理）
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const daily = findNum(p[dayKey], p.today, p.dailyBuildCount, p.buildCount);
  const monthly = findNum(p[monthKey], p.month, p.monthlyBuildCount);
  return { dailyBuilds: Number(daily) || 0, monthlyBuilds: Number(monthly) || 0, raw: p };
}

/** Pages Cloud Functions 请求趋势 */
export async function fetchPagesCfRequests(env, zoneId, { start, end } = {}, allowed = null) {
  const target = await discoverPagesZone(env, zoneId, allowed);
  const payload = { ZoneId: target, Interval: 'hour' };
  if (start) payload.StartTime = start;
  if (end) payload.EndTime = end;
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribePagesFunctionsRequestDataByZone', payload, allowed)
  );
  const p = res.parsedResult || res;
  const list = Array.isArray(p) ? p : p.Data || p.data || p.list || [];
  const points = list
    .map((it) => ({ t: new Date(it.Time || it.Timestamp || it.DateTime || it.startTime).getTime(), v: Number(it.Request || it.Requests || it.Value || it.count || 0) }))
    .filter((it) => Number.isFinite(it.t) && Number.isFinite(it.v));
  return { points, raw: p };
}

/** Pages Cloud Functions 月度汇总 */
export async function fetchPagesCfMonthly(env, zoneId, allowed = null) {
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribeHistoryCloudFunctionStats', '{}', allowed)
  );
  const p = res.parsedResult || res;
  return {
    monthlyRequests: Number(findNum(p?.month?.requests, p?.requests, p?.totalRequests)) || 0,
    monthlyGbs: Number(findNum(p?.month?.gbs, p?.gbs, p?.totalGbs)) || 0,
    raw: p
  };
}
