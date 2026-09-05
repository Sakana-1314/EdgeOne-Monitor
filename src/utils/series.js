/**
 * src/utils/series.js —— 把后端指标结果转换为 ECharts 趋势序列
 */
import { meta } from '../config/metrics.js';

/**
 * @param {object} data  useMetrics 返回的 reactive map
 * @param {string[]} ids
 * @param {object} o     { area?: boolean, stack?: boolean }
 * @returns [{ name, color, unit, points, areaOpacity }]
 */
export function seriesFrom(data, ids, o = {}) {
  const out = [];
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
export function hasTime(data, id) {
  const m = data[id];
  return Boolean(m && m.kind === 'time' && Array.isArray(m.points) && m.points.length);
}
