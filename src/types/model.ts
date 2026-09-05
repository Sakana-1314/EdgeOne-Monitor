/**
 * src/types/model.ts —— 前后端共享数据模型
 *
 * 从真实运行时形态抽取：站点、时序/TOP 指标、各接口返回结构、登录结果等，
 * 供 config / api / store / composables / views 复用。
 */

/** 站点（/api/zones 返回；白名单列表） */
export interface Zone {
  id: string;
  name: string;
  /** 站点类型/地域（腾讯云返回，可能为空字符串） */
  area?: string;
}

/** 指标单位 */
export type MetricUnit = 'bytes' | 'bps' | 'count' | 'ms';

/** 时序点 */
export interface TimePoint {
  /** 毫秒时间戳 */
  t: number;
  v: number;
}

/** 时序指标结果（kind === 'time'） */
export interface TimeMetric {
  id: string;
  kind: 'time';
  points: TimePoint[];
  sum: number;
  max: number;
  avg: number;
  /** 上一周期对比值（后端 compare=true 时附带） */
  prevSum?: number;
  prevMax?: number;
  prevAvg?: number;
  error?: string;
}

/** TOP 排行单项 */
export interface TopDatum {
  key: string;
  value: number;
}

/** TOP 指标结果（kind === 'top'） */
export interface TopMetric {
  id: string;
  kind: 'top';
  data: TopDatum[];
  error?: string;
}

/** 单条指标结果（时序 或 TOP） */
export type MetricResult = TimeMetric | TopMetric;

/** /api/config 返回 data */
export interface ConfigData {
  siteName: string;
  siteIcon: string;
  version: string;
  configured: boolean;
  time?: string;
}

/** /api/health 返回 data */
export interface HealthData {
  ok: boolean;
  configured: boolean;
  version: string;
  time?: string;
}

/** /api/metrics 返回 data */
export interface MetricsData {
  meta?: {
    startTime?: string;
    endTime?: string;
    interval?: string;
    zoneId?: string;
  };
  metrics: Record<string, MetricResult>;
}

/** /api/zones 返回 data */
export interface ZonesData {
  zones: Zone[];
}

/** JWT 登录用户 */
export interface LoginUser {
  username: string;
  name?: string;
}

/** /api/auth/login 返回 data */
export interface LoginData {
  token: string;
  tokenType?: string;
  expiresIn?: number;
  expiresAt?: number;
  user?: LoginUser;
}

/** /api/auth/me 返回 data */
export interface MeData {
  user?: { username?: string };
  exp?: number;
  iat?: number;
}

/** 指标批量查询参数 */
export interface MetricsQuery {
  startISO?: string;
  endISO?: string;
  interval?: string;
  zoneId?: string;
  compare?: boolean;
}

/** /api/pages/build-count data（后端尽力解析，字段可能缺失） */
export interface PagesBuildData {
  dailyBuilds?: number;
  monthlyBuilds?: number;
  /** 当月构建进度 0-100（部分后端返回） */
  monthProgress?: number;
  /** 近 N 天构建趋势（部分后端返回） */
  trend?: Array<{ date: string; v: number }>;
}

/** /api/pages/cf-requests data */
export interface PagesCfRequestsData {
  points?: TimePoint[];
}

/** /api/pages/cf-monthly data */
export interface PagesCfMonthlyData {
  monthlyRequests?: number;
  monthlyGbs?: number;
}

/** 查询时间范围 key（与 dashboard 常量对齐） */
export type RangeKey =
  | '30m'
  | '1h'
  | '3h'
  | '6h'
  | '12h'
  | '24h'
  | 'today'
  | 'yesterday'
  | '3d'
  | '7d'
  | '14d'
  | '31d'
  | 'custom';

/** 自定义时间范围 */
export interface CustomRange {
  d: number;
  h: number;
  m: number;
}
