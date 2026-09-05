/**
 * src/utils/format.ts —— 数值/时间格式化 + 通用异常信息提取
 */
import type { MetricUnit } from '../types/model';

const B_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
const S_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps', 'Pbps'];

function humanize(num: number, units: string[], base = 1024): string {
  if (!Number.isFinite(num)) return '0 ' + units[0];
  if (num === 0) return '0 ' + units[0];
  const neg = num < 0;
  const abs = Math.abs(num);
  let i = Math.floor(Math.log(abs) / Math.log(base));
  i = Math.max(0, Math.min(i, units.length - 1));
  let val = abs / Math.pow(base, i);
  val = val >= 100 ? Math.round(val) : val >= 10 ? +val.toFixed(1) : +val.toFixed(2);
  return (neg ? '-' : '') + val + ' ' + units[i];
}

export const formatBytes = (n: number): string => humanize(n, B_UNITS);
export const formatSpeed = (n: number): string => humanize(n, S_UNITS);

/** 中文计数：<1千原样，千/万/亿 */
export function formatCount(n: number): string {
  const v = Math.round(Number(n) || 0);
  if (v < 1000) return String(v);
  if (v < 10000) return (v / 1000).toFixed(2) + ' 千';
  if (v < 1e8) return (v / 1e4).toFixed(2) + ' 万';
  return (v / 1e8).toFixed(2) + ' 亿';
}

/** 千分位整数 */
export const formatInt = (n: number): string => Math.round(Number(n) || 0).toLocaleString('en-US');

/** KPI 展示风格 */
export type FormatStyle = 'kpi' | 'raw';

/** 针对 metric 单位格式化 KPI 数值（不显示单位后缀的精确形式由调用方组合） */
export function formatByUnit(n: number, unit: MetricUnit, style: FormatStyle = 'kpi'): string {
  switch (unit) {
    case 'bytes':
      return formatBytes(n);
    case 'bps':
      return formatSpeed(n);
    case 'count':
      return style === 'raw' ? formatInt(n) : formatCount(n);
    case 'ms':
      return n >= 1000000 ? formatMsSmart(n) : (Number(n) >= 100 ? Math.round(n) : +Number(n).toFixed(1)) + ' ms';
    default:
      return String(n);
  }
}

/** CPU/耗时大数值 -> 人类可读（ms/s/min/h） */
export function formatMsSmart(ms: number): string {
  if (!Number.isFinite(ms)) return '0 ms';
  if (ms < 1000) return Math.round(ms) + ' ms';
  const s = ms / 1000;
  if (s < 60) return s.toFixed(1) + ' s';
  const m = s / 60;
  if (m < 60) return m.toFixed(1) + ' min';
  const h = m / 60;
  return h.toFixed(2) + ' h';
}

/** Y 轴 scale 配置 */
export interface AxisScale {
  scale: number;
  unitLabel: string;
}

/** 时序图表 Y 轴：根据数据最大值挑选合适的单位除数，返回 scale 配置 */
export function axisScale(unit: MetricUnit, maxVal: number): AxisScale {
  const mv = Math.max(0, Number(maxVal) || 0);
  if (unit === 'count') {
    for (const [s, lab] of [[1e8, '亿'], [1e4, '万'], [1000, '千']] as Array<[number, string]>) {
      if (mv >= s) return { scale: s, unitLabel: lab };
    }
    return { scale: 1, unitLabel: '' };
  }
  if (unit === 'bytes' || unit === 'bps') {
    const units = unit === 'bytes' ? B_UNITS : S_UNITS;
    const base = unit === 'bytes' ? 1024 : 1000;
    let i = Math.floor(Math.log(mv || 1) / Math.log(base));
    i = Math.max(0, Math.min(i, units.length - 1));
    return { scale: Math.pow(base, i), unitLabel: units[i] };
  }
  return { scale: 1, unitLabel: 'ms' };
}

/** 将数值按 scale 换算（用于 y 轴与 tooltip） */
export function scaled(v: number, scale: number): number {
  const x = v / scale;
  return Math.abs(x) >= 100 ? Math.round(x) : +x.toFixed(x >= 10 ? 1 : 2);
}

/** X 轴标签时间格式化（ms 时间戳） */
export function timeLabel(t: number, stepMs: number): string {
  const d = new Date(t);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (stepMs >= 86400000) {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (stepMs >= 3600000) {
    return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`;
  }
  return `${hh}:${mm}`;
}

/** tooltip 时间：YYYY-MM-DD HH:mm:ss */
export function timeFull(t: number): string {
  const d = new Date(t);
  const p = (x: number): string => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 环比计算（无有效上一周期时返回 null） */
export function growthPct(cur: number, prev: number): number | null {
  if (!Number.isFinite(prev) || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

/** KPI 值统一展示（bytes/bps/count/ms） */
export function formatKpi(v: number | null | undefined, unit: MetricUnit): string {
  if (v == null || !Number.isFinite(Number(v))) return '—';
  switch (unit) {
    case 'bytes':
      return formatBytes(v);
    case 'bps':
      return formatSpeed(v);
    case 'count':
      return formatCount(v);
    case 'ms':
      if (v >= 60000) return formatMsSmart(v);
      return (Number(v) >= 100 ? Math.round(v) : +Number(v).toFixed(1)) + ' ms';
    default:
      return String(v);
  }
}

/** 从任意异常中提取可读信息（异常统一为 Error/带 message 的对象） */
export function errText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return '';
}
