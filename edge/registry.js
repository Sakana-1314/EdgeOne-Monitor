/**
 * edge/registry.js
 * 指标注册表：统一描述每个指标的类型(kind)与单位(unit)，
 * 供“真实数据 Provider”做 API 路由、“演示数据 Provider”生成数据使用。
 *
 * kind: 'time'  时序指标（趋势/求和） | 'top'  排行指标（{key,value} 列表）
 * unit: bytes(流量) | bps(带宽) | count(次数) | ms(耗时)
 */

export const UNIT = { BYTES: 'bytes', BPS: 'bps', COUNT: 'count', MS: 'ms' };
export const KIND = { TIME: 'time', TOP: 'top' };

// 每个指标的元数据。mockScale 仅演示数据模式用来生成量级合适的数值：
//   unit=bytes/count 的指标 -> 每秒基准速率（每采样点 = rate × step）
//   unit=bps         的指标 -> 每采样点的瞬时峰值基准（bps）
//   unit=ms          的指标 -> 每采样点的耗时基准(ms)；cpuCostTime 例外按每秒累计 ms
export const METRIC = {
  // ---- 流量 ----
  'l7Flow_flux': { kind: KIND.TIME, unit: UNIT.BYTES, label: '总流量', mockScale: 150e6 },
  'l7Flow_inFlux': { kind: KIND.TIME, unit: UNIT.BYTES, label: '客户端请求流量', mockScale: 55e6 },
  'l7Flow_outFlux': { kind: KIND.TIME, unit: UNIT.BYTES, label: '响应流量', mockScale: 95e6 },
  // ---- 带宽 ----
  'l7Flow_bandwidth': { kind: KIND.TIME, unit: UNIT.BPS, label: '总带宽峰值', mockScale: 1.2e9 },
  'l7Flow_inBandwidth': { kind: KIND.TIME, unit: UNIT.BPS, label: '请求带宽峰值', mockScale: 450e6 },
  'l7Flow_outBandwidth': { kind: KIND.TIME, unit: UNIT.BPS, label: '响应带宽峰值', mockScale: 750e6 },
  // ---- 请求 / 性能 ----
  'l7Flow_request': { kind: KIND.TIME, unit: UNIT.COUNT, label: '总请求数', mockScale: 1500 },
  'l7Flow_avgResponseTime': { kind: KIND.TIME, unit: UNIT.MS, label: '平均响应耗时', mockScale: 65 },
  'l7Flow_avgFirstByteResponseTime': { kind: KIND.TIME, unit: UNIT.MS, label: '平均首字节耗时', mockScale: 120 },
  // ---- 回源 ----
  'l7Flow_outFlux_hy': { kind: KIND.TIME, unit: UNIT.BYTES, label: '回源请求流量', mockScale: 22e6 },
  'l7Flow_inFlux_hy': { kind: KIND.TIME, unit: UNIT.BYTES, label: '回源响应流量', mockScale: 30e6 },
  'l7Flow_outBandwidth_hy': { kind: KIND.TIME, unit: UNIT.BPS, label: '回源请求带宽峰值', mockScale: 180e6 },
  'l7Flow_inBandwidth_hy': { kind: KIND.TIME, unit: UNIT.BPS, label: '回源响应带宽峰值', mockScale: 260e6 },
  'l7Flow_request_hy': { kind: KIND.TIME, unit: UNIT.COUNT, label: '回源请求数', mockScale: 180 },
  // ---- 安全 ----
  'ccAcl_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT, label: '精确防护拦截', mockScale: 0.05 },
  'ccManage_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT, label: '托管规则拦截', mockScale: 0.8 },
  'ccRate_interceptNum': { kind: KIND.TIME, unit: UNIT.COUNT, label: '速率限制拦截', mockScale: 0.3 },
  // ---- 边缘函数 ----
  'function_requestCount': { kind: KIND.TIME, unit: UNIT.COUNT, label: '边缘函数请求数', mockScale: 40 },
  'function_cpuCostTime': { kind: KIND.TIME, unit: UNIT.MS, label: '边缘函数 CPU 耗时', mockScale: 9000 },
  // ---- TOP: 响应流量维度 ----
  'l7Flow_outFlux_country': { kind: KIND.TOP, unit: UNIT.BYTES, label: '国家/地区流量' },
  'l7Flow_outFlux_province': { kind: KIND.TOP, unit: UNIT.BYTES, label: '国内省份流量' },
  'l7Flow_outFlux_statusCode': { kind: KIND.TOP, unit: UNIT.BYTES, label: '状态码流量' },
  'l7Flow_outFlux_domain': { kind: KIND.TOP, unit: UNIT.BYTES, label: '域名流量' },
  'l7Flow_outFlux_url': { kind: KIND.TOP, unit: UNIT.BYTES, label: 'URL 流量' },
  'l7Flow_outFlux_resourceType': { kind: KIND.TOP, unit: UNIT.BYTES, label: '资源类型流量' },
  'l7Flow_outFlux_sip': { kind: KIND.TOP, unit: UNIT.BYTES, label: '客户端 IP 流量' },
  'l7Flow_outFlux_referers': { kind: KIND.TOP, unit: UNIT.BYTES, label: 'Referer 流量' },
  'l7Flow_outFlux_ua_device': { kind: KIND.TOP, unit: UNIT.BYTES, label: '设备类型流量' },
  'l7Flow_outFlux_ua_browser': { kind: KIND.TOP, unit: UNIT.BYTES, label: '浏览器流量' },
  'l7Flow_outFlux_ua_os': { kind: KIND.TOP, unit: UNIT.BYTES, label: '操作系统流量' },
  'l7Flow_outFlux_ua': { kind: KIND.TOP, unit: UNIT.BYTES, label: 'User Agent 流量' },
  // ---- TOP: 请求数维度 ----
  'l7Flow_request_country': { kind: KIND.TOP, unit: UNIT.COUNT, label: '国家/地区请求数' },
  'l7Flow_request_province': { kind: KIND.TOP, unit: UNIT.COUNT, label: '国内省份请求数' },
  'l7Flow_request_statusCode': { kind: KIND.TOP, unit: UNIT.COUNT, label: '状态码请求数' },
  'l7Flow_request_domain': { kind: KIND.TOP, unit: UNIT.COUNT, label: '域名请求数' },
  'l7Flow_request_url': { kind: KIND.TOP, unit: UNIT.COUNT, label: 'URL 请求数' },
  'l7Flow_request_resourceType': { kind: KIND.TOP, unit: UNIT.COUNT, label: '资源类型请求数' },
  'l7Flow_request_sip': { kind: KIND.TOP, unit: UNIT.COUNT, label: '客户端 IP 请求数' },
  'l7Flow_request_referers': { kind: KIND.TOP, unit: UNIT.COUNT, label: 'Referer 请求数' },
  'l7Flow_request_ua_device': { kind: KIND.TOP, unit: UNIT.COUNT, label: '设备类型请求数' },
  'l7Flow_request_ua_browser': { kind: KIND.TOP, unit: UNIT.COUNT, label: '浏览器请求数' },
  'l7Flow_request_ua_os': { kind: KIND.TOP, unit: UNIT.COUNT, label: '操作系统请求数' },
  'l7Flow_request_ua': { kind: KIND.TOP, unit: UNIT.COUNT, label: 'User Agent 请求数' }
};

// 指标 -> 真实 API 路由分组
export const SOURCE = {
  ORIGIN: 'origin',           // DescribeTimingL7OriginPullData
  TOP: 'top',                 // DescribeTopL7AnalysisData
  SECURITY: 'security',       // DescribeWebProtectionData
  FUNCTIONS: 'functions',     // DescribeTimingFunctionAnalysisData
  TIMING: 'timing'            // DescribeTimingL7AnalysisData
};

const ORIGIN_METRICS = new Set([
  'l7Flow_outFlux_hy', 'l7Flow_inFlux_hy',
  'l7Flow_outBandwidth_hy', 'l7Flow_inBandwidth_hy', 'l7Flow_request_hy'
]);
const SECURITY_METRICS = new Set(['ccAcl_interceptNum', 'ccManage_interceptNum', 'ccRate_interceptNum']);
const FUNCTION_METRICS = new Set(['function_requestCount', 'function_cpuCostTime']);

export function sourceOf(metricId) {
  if (!(metricId in METRIC)) return null;
  if (METRIC[metricId].kind === KIND.TOP) return SOURCE.TOP;
  if (ORIGIN_METRICS.has(metricId)) return SOURCE.ORIGIN;
  if (SECURITY_METRICS.has(metricId)) return SOURCE.SECURITY;
  if (FUNCTION_METRICS.has(metricId)) return SOURCE.FUNCTIONS;
  return SOURCE.TIMING;
}

export function isValidMetric(id) {
  return id in METRIC;
}

/** 校验 time 范围字符串，并返回 UTC 格式，非法返回 null */
export function normalizeTime(str, fallback) {
  if (!str) return fallback;
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19) + 'Z';
}

export const INTERVALS = ['auto', 'min', '5min', 'hour', 'day'];
export function normalizeInterval(iv) {
  return iv && INTERVALS.includes(iv) ? iv : 'auto';
}
