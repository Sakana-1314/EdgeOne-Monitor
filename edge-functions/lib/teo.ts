/**
 * edge-functions/lib/teo.ts —— 腾讯云 EdgeOne 数据接口封装（TC3 签名直连）
 * 基于 fetch + TC3 签名直连 EdgeOne 开放接口，可运行于边缘函数 / Pages Function / Node。
 *
 * 说明：真实模式需要环境变量 SECRET_ID / SECRET_KEY（仅需 EdgeOne 只读权限）。
 * 所有方法均返回“已归一化”的结构，供后端路由直接使用。
 */

import { requestTC3 } from './tc3.ts';
import { SOURCE, sourceOf, KIND } from './registry.ts';
import { errorMessage } from './utils.ts';
import type {
  Env,
  DataPoint,
  TimeMetricResult,
  TopMetricResult,
  MetricsMap,
  ZoneRecord,
  MetricQueryOptions
} from './types.ts';

/** 便于导航的“任意记录”别名（键为字符串、值为 unknown） */
type AnyRecord = Record<string, unknown>;
type RawList = unknown[];

/** 找到一次时序接口返回中指定指标的那一组 */
function findMetricBlock(
  response: AnyRecord | undefined,
  metricId: string,
  { listKey = 'Data' }: { listKey?: string } = {}
): AnyRecord | null {
  // 注意：回源接口(DescribeTimingL7OriginPullData)把记录放在顶层 TimingDataRecords，
  // 其余时序接口放在 Data 下。统一按 listKey 取值，再兼容兜底。
  let arr: unknown = response?.[listKey];
  if (!Array.isArray(arr)) {
    arr = Array.isArray(response?.Data)
      ? response.Data
      : Array.isArray(response?.TimingDataRecords)
        ? response.TimingDataRecords
        : [response];
  }
  const dataArr = arr as RawList;
  for (const item of dataArr) {
    if (!item || typeof item !== 'object') continue;
    const block = item as AnyRecord;
    // 某些接口直接返回 TypeValue / Value 数组
    for (const key of ['TypeValue', 'Value']) {
      const sub = block[key];
      if (Array.isArray(sub)) {
        const hit = (sub as RawList).find((m) => {
          if (!m || typeof m !== 'object') return false;
          const rec = m as AnyRecord;
          return rec.MetricName === metricId || rec.Metric === metricId;
        });
        if (hit) return hit as AnyRecord;
      }
    }
    if (block.MetricName === metricId || block.Metric === metricId) return block;
  }
  // fallback: 返回第一组（用于单指标接口）
  const first = dataArr[0] as AnyRecord | undefined;
  for (const key of ['TypeValue', 'Value']) {
    const sub = first?.[key];
    if (Array.isArray(sub) && sub.length) return sub[0] as AnyRecord;
  }
  return null;
}

/** 依次取第一个合法数值；都不合法返回 0 */
function pickNum(...vals: unknown[]): number {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** 将一次时序返回中的单个指标归一化 */
function normalizeTimeBlock(block: AnyRecord | null | undefined, metricId: string): TimeMetricResult {
  const detailRaw = block?.Detail;
  const detail = Array.isArray(detailRaw) ? (detailRaw as RawList) : [];
  const points: DataPoint[] = [];
  for (const item of detail) {
    const rec = item as AnyRecord;
    const t = rec.Timestamp || rec.Time || rec.DateTime;
    const v = Number(rec.Value);
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
function normalizeTopResponse(response: AnyRecord, metricId: string): TopMetricResult {
  const data0 = (response?.Data as AnyRecord | undefined)?.[0];
  const detail = (data0 as AnyRecord | undefined)?.DetailData;
  const raw: unknown = detail || response?.TopData || [];
  const data = (raw as RawList).map((d) => {
    const rec = d as AnyRecord;
    return { key: String(rec.Key ?? ''), value: Number(rec.Value) || 0 };
  });
  return { id: metricId, kind: KIND.TOP, data };
}

function buildBaseParams(opts: MetricQueryOptions): Record<string, unknown> {
  const p: Record<string, unknown> = { StartTime: opts.start, EndTime: opts.end, ZoneIds: opts.zoneIds };
  if (opts.interval && opts.interval !== 'auto') p.Interval = opts.interval;
  return p;
}

/** 分组批量拉取指标（时间类按接口合并，TOP 类逐条拉取） */
export async function fetchMetrics(
  env: Env,
  ids: string[],
  opts: MetricQueryOptions
): Promise<MetricsMap> {
  const results: MetricsMap = {};
  const timeBySource: Record<string, string[]> = {};
  const topIds: string[] = [];

  for (const id of ids) {
    const s = sourceOf(id);
    if (s === SOURCE.TOP) topIds.push(id);
    else if (s) (timeBySource[s] ||= []).push(id);
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
      } catch (e: unknown) {
        results[id] = { id, kind: KIND.TOP, data: [], error: errorMessage(e) };
      }
    })
  );

  const ACTION: Record<string, string> = {
    [SOURCE.TIMING]: 'DescribeTimingL7AnalysisData',
    [SOURCE.ORIGIN]: 'DescribeTimingL7OriginPullData',
    [SOURCE.SECURITY]: 'DescribeWebProtectionData',
    [SOURCE.FUNCTIONS]: 'DescribeTimingFunctionAnalysisData'
  };

  for (const [src, names] of Object.entries(timeBySource)) {
    const action = ACTION[src];
    if (!action) continue;
    const params: Record<string, unknown> = { ...buildBaseParams(opts), MetricNames: names };
    try {
      const res = await requestTC3(env, action, params);
      const listKey = src === SOURCE.ORIGIN ? 'TimingDataRecords' : 'Data';
      for (const id of names) {
        const block = findMetricBlock(res, id, { listKey });
        results[id] = block
          ? normalizeTimeBlock(block, id)
          : { id, kind: KIND.TIME, points: [], sum: 0, max: 0, avg: 0 };
      }
    } catch (e: unknown) {
      for (const id of names) {
        results[id] = { id, kind: KIND.TIME, points: [], sum: 0, max: 0, avg: 0, error: errorMessage(e) };
      }
    }
  }
  return results;
}

/** 站点列表（allowed 为空数组/未传 = 全部；非空时仅返回白名单内站点） */
export async function listZones(env: Env, allowed: string[] | null = null): Promise<ZoneRecord[]> {
  const res = await requestTC3(env, 'DescribeZones', {});
  const zones = Array.isArray(res?.Zones) ? (res.Zones as RawList) : [];
  let list: ZoneRecord[] = zones
    .map((z) => {
      const rec = z as AnyRecord;
      return {
        id: rec.ZoneId as string,
        name:
          rec.ZoneName === 'default-pages-zone' ? `${rec.ZoneName} (Pages站点)` : (rec.ZoneName as string),
        area: (rec.ZoneType || rec.Area || '') as string
      };
    })
    .sort((a, b) =>
      a.name === 'default-pages-zone (Pages站点)' ? -1 : a.name.localeCompare(b.name)
    );
  if (allowed && allowed.length) {
    const set = new Set(allowed);
    list = list.filter((z) => set.has(z.id));
  }
  return list;
}

async function discoverPagesZone(
  env: Env,
  zoneId: string,
  allowed: string[] | null = null
): Promise<string> {
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

async function callPagesInterface(
  env: Env,
  zoneId: string,
  iface: string,
  payload: string | Record<string, unknown>,
  allowed: string[] | null = null
): Promise<AnyRecord> {
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
function parsePagesResult(res: AnyRecord): AnyRecord {
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

/** 取第一个非空值（0/false 之外的空值），无则返回 0 */
const findNum = (...keys: unknown[]): unknown => {
  for (const k of keys) {
    if (k != null) return k;
  }
  return 0;
};

/** Pages 构建统计 */
export async function fetchPagesBuild(
  env: Env,
  zoneId: string,
  allowed: string[] | null = null
): Promise<{ dailyBuilds: number; monthlyBuilds: number; raw: AnyRecord }> {
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribePagesDeploymentUsage', '{}', allowed)
  );
  const p = (res.parsedResult || res) as AnyRecord;
  // 尽力解析（真实返回结构以腾讯云为准，容错处理）
  const today = new Date();
  const dayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const daily = findNum(p[dayKey], p.today, p.dailyBuildCount, p.buildCount);
  const monthly = findNum(p[monthKey], p.month, p.monthlyBuildCount);
  return { dailyBuilds: Number(daily) || 0, monthlyBuilds: Number(monthly) || 0, raw: p };
}

/** Pages Cloud Functions 请求趋势 */
export async function fetchPagesCfRequests(
  env: Env,
  zoneId: string,
  opts: { start?: string; end?: string } = {},
  allowed: string[] | null = null
): Promise<{ points: DataPoint[]; raw: AnyRecord }> {
  const { start, end } = opts;
  const target = await discoverPagesZone(env, zoneId, allowed);
  const payload: Record<string, unknown> = { ZoneId: target, Interval: 'hour' };
  if (start) payload.StartTime = start;
  if (end) payload.EndTime = end;
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribePagesFunctionsRequestDataByZone', payload, allowed)
  );
  const p = (res.parsedResult || res) as AnyRecord;
  const list: unknown = Array.isArray(p) ? p : p.Data || p.data || p.list || [];
  const points: DataPoint[] = (list as RawList)
    .map((it) => {
      const rec = it as AnyRecord;
      const t = new Date((rec.Time || rec.Timestamp || rec.DateTime || rec.startTime) as string | number).getTime();
      const v = Number(rec.Request || rec.Requests || rec.Value || rec.count || 0);
      return { t, v };
    })
    .filter((pt) => Number.isFinite(pt.t) && Number.isFinite(pt.v));
  return { points, raw: p };
}

/** Pages Cloud Functions 月度汇总 */
export async function fetchPagesCfMonthly(
  env: Env,
  zoneId: string,
  allowed: string[] | null = null
): Promise<{ monthlyRequests: number; monthlyGbs: number; raw: AnyRecord }> {
  const res = parsePagesResult(
    await callPagesInterface(env, zoneId, 'pages:DescribeHistoryCloudFunctionStats', '{}', allowed)
  );
  const p = (res.parsedResult || res) as AnyRecord;
  const monthRec = typeof p.month === 'object' && p.month !== null ? (p.month as AnyRecord) : undefined;
  const monthly = findNum(monthRec ? monthRec.requests : undefined, p.requests, p.totalRequests);
  const gbs = findNum(monthRec ? monthRec.gbs : undefined, p.gbs, p.totalGbs);
  return {
    monthlyRequests: Number(monthly) || 0,
    monthlyGbs: Number(gbs) || 0,
    raw: p
  };
}
