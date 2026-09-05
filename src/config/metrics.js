/**
 * src/config/metrics.js
 * 指标展示元数据（标签/颜色/单位），与 node-functions/lib/registry.js 的指标 id 一一对应。
 * unit: bytes | bps | count | ms
 * kpi:  KPI 卡片取 sum（总量）还是 avg（均值）
 */

export const M = {
  // 流量
  'l7Flow_flux': { label: '总流量', unit: 'bytes', color: '#3b82f6', kpi: 'sum' },
  'l7Flow_inFlux': { label: '客户端请求流量', unit: 'bytes', color: '#22c55e', kpi: 'sum' },
  'l7Flow_outFlux': { label: '响应流量', unit: 'bytes', color: '#f59e0b', kpi: 'sum' },
  // 带宽
  'l7Flow_bandwidth': { label: '总带宽峰值', unit: 'bps', color: '#3b82f6', kpi: 'max' },
  'l7Flow_inBandwidth': { label: '请求带宽峰值', unit: 'bps', color: '#22c55e', kpi: 'max' },
  'l7Flow_outBandwidth': { label: '响应带宽峰值', unit: 'bps', color: '#f59e0b', kpi: 'max' },
  // 请求 / 性能
  'l7Flow_request': { label: '总请求数', unit: 'count', color: '#3b82f6', kpi: 'sum' },
  'l7Flow_avgResponseTime': { label: '平均响应耗时', unit: 'ms', color: '#8b5cf6', kpi: 'avg' },
  'l7Flow_avgFirstByteResponseTime': { label: '平均首字节耗时', unit: 'ms', color: '#ec4899', kpi: 'avg' },
  // 回源
  'l7Flow_outFlux_hy': { label: '回源请求流量', unit: 'bytes', color: '#3b82f6', kpi: 'sum' },
  'l7Flow_inFlux_hy': { label: '回源响应流量', unit: 'bytes', color: '#22c55e', kpi: 'sum' },
  'l7Flow_outBandwidth_hy': { label: '回源请求带宽峰值', unit: 'bps', color: '#f59e0b', kpi: 'max' },
  'l7Flow_inBandwidth_hy': { label: '回源响应带宽峰值', unit: 'bps', color: '#ec4899', kpi: 'max' },
  'l7Flow_request_hy': { label: '回源请求数', unit: 'count', color: '#06b6d4', kpi: 'sum' },
  // 安全
  'ccAcl_interceptNum': { label: '精确防护拦截', unit: 'count', color: '#3b82f6', kpi: 'sum' },
  'ccManage_interceptNum': { label: '托管规则拦截', unit: 'count', color: '#f59e0b', kpi: 'sum' },
  'ccRate_interceptNum': { label: '速率限制拦截', unit: 'count', color: '#8b5cf6', kpi: 'sum' },
  // 边缘函数
  'function_requestCount': { label: '边缘函数请求数', unit: 'count', color: '#3b82f6', kpi: 'sum' },
  'function_cpuCostTime': { label: '边缘函数 CPU 耗时', unit: 'ms', color: '#f59e0b', kpi: 'sum' },
  // TOP：响应流量维度
  'l7Flow_outFlux_country': { label: '国家/地区流量', unit: 'bytes', color: '#3b82f6', rank: true, map: true },
  'l7Flow_outFlux_province': { label: '国内省份流量', unit: 'bytes', color: '#f59e0b', rank: true, china: true },
  'l7Flow_outFlux_statusCode': { label: '状态码流量', unit: 'bytes', color: '#8b5cf6', rank: true },
  'l7Flow_outFlux_domain': { label: '域名流量', unit: 'bytes', color: '#06b6d4', rank: true },
  'l7Flow_outFlux_url': { label: 'URL 流量', unit: 'bytes', color: '#10b981', rank: true },
  'l7Flow_outFlux_resourceType': { label: '资源类型流量', unit: 'bytes', color: '#f59e0b', rank: true },
  'l7Flow_outFlux_sip': { label: '客户端 IP 流量', unit: 'bytes', color: '#ef4444', rank: true },
  'l7Flow_outFlux_referers': { label: 'Referer 流量', unit: 'bytes', color: '#8b5cf6', rank: true },
  'l7Flow_outFlux_ua_device': { label: '设备类型流量', unit: 'bytes', color: '#06b6d4', rank: true },
  'l7Flow_outFlux_ua_browser': { label: '浏览器流量', unit: 'bytes', color: '#f59e0b', rank: true },
  'l7Flow_outFlux_ua_os': { label: '操作系统流量', unit: 'bytes', color: '#10b981', rank: true },
  'l7Flow_outFlux_ua': { label: 'User Agent 流量', unit: 'bytes', color: '#8b5cf6', rank: true },
  // TOP：请求数维度
  'l7Flow_request_country': { label: '国家/地区请求数', unit: 'count', color: '#3b82f6', rank: true, map: true },
  'l7Flow_request_province': { label: '国内省份请求数', unit: 'count', color: '#f59e0b', rank: true, china: true },
  'l7Flow_request_statusCode': { label: '状态码请求数', unit: 'count', color: '#8b5cf6', rank: true },
  'l7Flow_request_domain': { label: '域名请求数', unit: 'count', color: '#06b6d4', rank: true },
  'l7Flow_request_url': { label: 'URL 请求数', unit: 'count', color: '#10b981', rank: true },
  'l7Flow_request_resourceType': { label: '资源类型请求数', unit: 'count', color: '#f59e0b', rank: true },
  'l7Flow_request_sip': { label: '客户端 IP 请求数', unit: 'count', color: '#ef4444', rank: true },
  'l7Flow_request_referers': { label: 'Referer 请求数', unit: 'count', color: '#ec4899', rank: true },
  'l7Flow_request_ua_device': { label: '设备类型请求数', unit: 'count', color: '#06b6d4', rank: true },
  'l7Flow_request_ua_browser': { label: '浏览器请求数', unit: 'count', color: '#10b981', rank: true },
  'l7Flow_request_ua_os': { label: '操作系统请求数', unit: 'count', color: '#f59e0b', rank: true },
  'l7Flow_request_ua': { label: 'User Agent 请求数', unit: 'count', color: '#8b5cf6', rank: true }
};

export const meta = (id) => M[id] || { label: id, unit: 'count', color: '#64748b', kpi: 'sum' };

/**
 * 从后端指标结果中取 KPI 当前值与上一周期值
 */
export function kpiOf(m, id) {
  if (!m) return { cur: null, prev: null, unit: 'count' };
  const mm = meta(id);
  const kind = mm.kpi || 'sum';
  const cur = m[kind];
  let prev;
  if (kind === 'max') prev = m.prevMax;
  else if (kind === 'avg') prev = m.prevAvg;
  else prev = m.prevSum;
  return { cur, prev, unit: mm.unit, kind };
}
