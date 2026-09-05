/**
 * src/utils/series.ts —— 把后端指标结果转换为 ECharts 趋势序列
 */
import { meta } from '../config/metrics';
import type { MetricResult, TimePoint } from '../types/model';

/** 趋势序列（供图表 option 构造使用） */
export interface TrendSeries {
  id: string;
  name: string;
  color: string;
  unit: string;
  points: TimePoint[];
  stack?: boolean;
  areaOpacity?: number;
}

/** seriesFrom 选项 */
export interface SeriesFromOptions {
  /** 是否带面积透明度（默认 true） */
  area?: boolean;
  /** 是否堆叠 */
  stack?: boolean;
}

/**
 * @param data   useMetrics 返回的 reactive map
 * @param ids    指标 id 列表
 */
export function seriesFrom(data: Record<string, MetricResult | undefined>, ids: string[], o: SeriesFromOptions = {}): TrendSeries[] {
  const out: TrendSeries[] = [];
  ids.forEach((id) => {
    const m = data[id];
    if (!m || m.kind !== 'time' || !Array.isArray(m.points) || !m.points.length) return;
    const mm = meta(id);
    out.push({
      id,
      name: mm.label,
      color: mm.color,
      unit: mm.unit,
      points: m.points,
      areaOpacity: o.area !== false ? 0.08 : 0
    });
  });
  return out;
}

/** 单一指标是否可渲染 */
export function hasTime(data: Record<string, MetricResult | undefined>, id: string): boolean {
  const m = data[id];
  return Boolean(m && m.kind === 'time' && Array.isArray(m.points) && m.points.length);
}
