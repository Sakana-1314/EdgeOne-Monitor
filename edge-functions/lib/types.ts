/**
 * edge-functions/lib/types.ts —— 共享类型定义（纯类型模块，不产生运行时导出）
 *
 * EdgeOne Edge Functions (V8) 后端涉及的公共数据结构：
 *   - Env：运行时注入的环境变量
 *   - 指标/时间窗口/站点等接口与联合类型
 *
 * 说明：本模块只被其他模块以 `import type` 引用，运行时不会加载。
 */

/** 运行时注入的环境变量（均可选；未知扩展键一律按 unknown 处理） */
export interface Env {
  SECRET_ID?: string;
  SECRET_KEY?: string;
  ADMIN_PASSWORD?: string;
  JWT_SECRET?: string;
  ALLOWED_ZONE_IDS?: string;
  TOKEN_TTL_DAYS?: string;
  SITE_NAME?: string;
  SITE_ICON?: string;
  ALLOW_ORIGINS?: string;
  TEO_ENDPOINT?: string;
  TEO_REGION?: string;
  [key: string]: unknown;
}

/** JWT 负载（业务字段可扩展，均视为可选；iat/exp 为秒级时间戳） */
export interface JwtClaims {
  sub?: string;
  username?: string;
  role?: string;
  iss?: string;
  aud?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/** 时序数据点（t 为毫秒时间戳，v 为数值） */
export interface DataPoint {
  t: number;
  v: number;
}

/** 时序指标结果（kind === 'time'） */
export interface TimeMetricResult {
  id: string;
  kind: 'time';
  points: DataPoint[];
  sum: number;
  max: number;
  avg: number;
  prevSum?: number;
  prevAvg?: number;
  prevMax?: number;
  error?: string;
}

/** 排行指标结果（kind === 'top'，{key, value} 列表） */
export interface TopMetricResult {
  id: string;
  kind: 'top';
  data: Array<{ key: string; value: number }>;
  error?: string;
}

/** 指标结果联合类型 */
export type MetricResult = TimeMetricResult | TopMetricResult;

/** 指标 id -> 结果 */
export type MetricsMap = Record<string, MetricResult>;

/** 单个 EdgeOne 站点记录 */
export interface ZoneRecord {
  id: string;
  name: string;
  area: string;
}

/** 成功解析出的时间窗口 */
export interface TimeWindow {
  start: string;
  end: string;
  startMs: number;
  endMs: number;
  interval: string;
  zoneId: string;
  zoneIds: string[];
}

/** parseWindow 的返回：成功携带 TimeWindow，失败仅携带错误文案 */
export type ParseWindowResult =
  | (TimeWindow & { ok: true })
  | { ok: false; error: string };

/** 批量拉取指标所需的窗口参数子集 */
export interface MetricQueryOptions {
  start: string;
  end: string;
  interval: string;
  zoneIds: string[];
}
