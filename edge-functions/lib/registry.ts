/**
 * edge-functions/lib/registry.ts
 * 指标注册表：描述每个指标的类型(kind)与单位(unit)，并把指标路由到对应的腾讯云接口。
 *
 * kind: 'time'  时序指标（趋势/求和） | 'top'  排行指标（{key,value} 列表）
 * unit: bytes(流量) | bps(带宽) | count(次数) | ms(耗时)
 */

export const UNIT = { BYTES: 'bytes', BPS: 'bps', COUNT: 'count', MS: 'ms' } as const;
export const KIND = { TIME: 'time', TOP: 'top' } as const;

export type MetricKind = (typeof KIND)[keyof typeof KIND];
export type UnitName = (typeof UNIT)[keyof typeof UNIT];

/** 单个指标的元信息 */
export interface MetricDef {
  kind: MetricKind;
  unit: UnitName;
}

export const METRIC: Record<string, MetricDef> = {
  // ---- 流量 ----
  'l7Flow_flux': { kind: KIND.TIME, unit: UNIT.BYTES },
  'l7Flow_inFlux': { kind: KIND.TIME, unit: UNIT.BYTES },
  'l7Flow_outFlux': { kind: KIND.TIME, unit: UNIT.BYTES },
  // ---- 带宽 ----
  'l7Flow_bandwidth': { kind: KIND.TIME, unit: UNIT.BPS },
  'l7Flow_inBandwidth': { kind: KIND.TIME, unit: UNIT.BPS },
  'l7Flow_outBandwidth': { kind: KIND.TIME, unit: UNIT.BPS },
  // ---- 请求 / 性能 ----
  'l7Flow_request': { kind: KIND.TIME, unit: UNIT.COUNT },
  'l7Flow_avgResponseTime': { kind: KIND.TIME, unit: UNIT.MS },
  'l7Flow_avgFirstByteResponseTime': { kind: KIND.TIME, unit: UNIT.MS },
  // ---- 回源 ----
  'l7Flow_outFlux_hy': { kind: KIND.TIME, unit: UNIT.BYTES },
  'l7Flow_inFlux_hy': { kind: KIND.TIME, unit: UNIT.BYTES },
  'l7Flow_outBandwidth_hy': { kind: KIND.TIME, unit: UNIT.BPS },
  'l7Flow_inBandwidth_hy': { kind: KIND.TIME, unit: UNIT.BPS },
  'l7Flow_request_hy': { kind: KIND.TIME, unit: UNIT.COUNT },
  // ---- 安全 ----
  'ccAcl_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT },
  'ccManage_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT },
  'ccRate_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT },
  // ---- 边缘函数 ----
  'function_requestCount': { kind: KIND.TIME, unit: UNIT.COUNT },
  'function_cpuCostTime': { kind: KIND.TIME, unit: UNIT.MS },
  // ---- TOP：响应流量维度 ----
  'l7Flow_outFlux_country': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_province': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_statusCode': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_domain': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_url': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_resourceType': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_sip': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_referers': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_ua_device': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_ua_browser': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_ua_os': { kind: KIND.TOP, unit: UNIT.BYTES },
  'l7Flow_outFlux_ua': { kind: KIND.TOP, unit: UNIT.BYTES },
  // ---- TOP：请求数维度 ----
  'l7Flow_request_country': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_province': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_statusCode': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_domain': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_url': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_resourceType': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_sip': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_referers': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_ua_device': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_ua_browser': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_ua_os': { kind: KIND.TOP, unit: UNIT.COUNT },
  'l7Flow_request_ua': { kind: KIND.TOP, unit: UNIT.COUNT }
};

/** 指标 -> 真实 API 分组 */
export const SOURCE = {
  ORIGIN: 'origin', // DescribeTimingL7OriginPullData
  TOP: 'top', // DescribeTopL7AnalysisData
  SECURITY: 'security', // DescribeWebProtectionData
  FUNCTIONS: 'functions', // DescribeTimingFunctionAnalysisData
  TIMING: 'timing' // DescribeTimingL7AnalysisData
} as const;

export type SourceName = (typeof SOURCE)[keyof typeof SOURCE];

const ORIGIN_METRICS: ReadonlySet<string> = new Set([
  'l7Flow_outFlux_hy', 'l7Flow_inFlux_hy',
  'l7Flow_outBandwidth_hy', 'l7Flow_inBandwidth_hy', 'l7Flow_request_hy'
]);
const SECURITY_METRICS: ReadonlySet<string> = new Set(['ccAcl_interceptNum', 'ccManage_interceptNum', 'ccRate_interceptNum']);
const FUNCTION_METRICS: ReadonlySet<string> = new Set(['function_requestCount', 'function_cpuCostTime']);

export function sourceOf(metricId: string): SourceName | null {
  if (!(metricId in METRIC)) return null;
  if (METRIC[metricId].kind === KIND.TOP) return SOURCE.TOP;
  if (ORIGIN_METRICS.has(metricId)) return SOURCE.ORIGIN;
  if (SECURITY_METRICS.has(metricId)) return SOURCE.SECURITY;
  if (FUNCTION_METRICS.has(metricId)) return SOURCE.FUNCTIONS;
  return SOURCE.TIMING;
}

export function isValidMetric(id: string): boolean {
  return id in METRIC;
}

/** 校验时间字符串并归一为 UTC，非法返回 null */
export function normalizeTime(str: string | null | undefined, fallback: string): string | null {
  if (!str) return fallback;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19) + 'Z';
}

export const INTERVALS: readonly string[] = ['auto', 'min', '5min', 'hour', 'day'];
export function normalizeInterval(iv: string | null | undefined): string {
  return iv && INTERVALS.includes(iv) ? iv : 'auto';
}
