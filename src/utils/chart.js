/**
 * src/utils/chart.js —— ECharts option 构造（趋势线 + 地图）
 */
import * as echarts from 'echarts';
import { chartPalette } from './theme.js';
import { axisScale, scaled, timeLabel, timeFull, formatBytes, formatSpeed, formatCount, formatByUnit } from './format.js';
import { worldNameMap } from '../config/geo.js';

/** 根据单位与数值格式化（tooltip 用，原始数值） */
export function fmtVal(unit, v, scale) {
  if (unit === 'bytes') return formatBytes(v);
  if (unit === 'bps') return formatSpeed(v);
  if (unit === 'ms') return formatByUnit(v, 'ms');
  // count
  const s = v / scale;
  const str = Math.abs(s) >= 100 ? String(Math.round(s)) : String(+s.toFixed(2));
  return formatCount(v);
}

/**
 * 折线/面积趋势 option
 * series: [{ name, color, unit, points:[{t,v}], stack?:boolean, areaOpacity }]
 */
export function buildTrendOption(series, { dark, stack = false, showLegend = true, height } = {}) {
  const P = chartPalette(dark);
  const cleanSeries = series.filter((s) => s && Array.isArray(s.points) && s.points.length);
  if (!cleanSeries.length) return null;

  const unit = cleanSeries[0].unit;
  const xPoints = cleanSeries.find((s) => s.points.length)?.points || [];
  let maxVal = 0;
  if (stack) {
    const n = Math.min(...cleanSeries.map((s) => s.points.length));
    for (let i = 0; i < n; i++) {
      const v = cleanSeries.reduce((a, s) => a + (s.points[i]?.v || 0), 0);
      maxVal = Math.max(maxVal, v);
    }
  } else {
    cleanSeries.forEach((s) => s.points.forEach((p) => (maxVal = Math.max(maxVal, p.v))));
  }
  const { scale, unitLabel } = axisScale(unit, maxVal);

  const stepMs = xPoints.length > 1 ? xPoints[1].t - xPoints[0].t : 3600000;
  const labels = xPoints.map((p) => timeLabel(p.t, stepMs));
  const rawMap = xPoints.map((p, i) => i); // index alignment

  const ecSeries = cleanSeries.map((s, idx) => {
    const line = {
      name: s.name,
      type: 'line',
      smooth: true,
      symbol: 'none',
      showSymbol: false,
      lineStyle: { width: idx === 0 && cleanSeries.length > 3 ? 1.8 : 2.2, color: s.color },
      itemStyle: { color: s.color },
      emphasis: { focus: 'series' },
      data: s.points.map((p) => scaled(p.v, scale)),
      _raw: s.points.map((p) => p.v),
      _t: s.points.map((p) => p.t)
    };
    const stackKey = stack ? 'total' : undefined;
    if (stackKey) {
      line.stack = 'total';
      line.areaStyle = { opacity: 0.85 };
      line.symbol = 'none';
    } else if (s.areaOpacity) {
      line.areaStyle = { opacity: s.areaOpacity, color: s.color };
      line.lineStyle = line.lineStyle;
    }
    return line;
  });

  const opt = {
    backgroundColor: 'transparent',
    animationDuration: 400,
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: P.tooltipBg,
      borderColor: P.tooltipBorder,
      textStyle: { color: P.text, fontSize: 12 },
      axisPointer: { type: 'line', lineStyle: { color: P.splitLine, type: 'dashed' } },
      formatter(params) {
        if (!params || !params.length) return '';
        const i = params[0].dataIndex;
        const t = ecSeries[0]._t[i];
        const tStr = t ? timeFull(t) : params[0].axisValue;
        let html = `<div style="font-weight:600;margin-bottom:4px">${tStr}</div>`;
        params.forEach((p) => {
          const s = ecSeries[p.seriesIndex];
          const raw = s._raw[p.dataIndex] ?? 0;
          const disp = fmtVal(unit, raw, scale);
          html += `<div style="display:flex;align-items:center;gap:6px">${p.marker}<span>${p.seriesName}</span><span style="margin-left:auto;font-weight:600">${disp}</span></div>`;
        });
        return html;
      }
    },
    legend: showLegend && cleanSeries.length > 1
      ? { top: 0, right: 4, itemWidth: 14, itemHeight: 8, textStyle: { color: P.legend, fontSize: 12 }, data: cleanSeries.map((s) => s.name) }
      : undefined,
    grid: {
      left: 8,
      right: 12,
      top: showLegend && cleanSeries.length > 1 ? 34 : 16,
      bottom: 4,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: P.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: P.subText, fontSize: 11, hideOverlap: true, margin: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: unitLabel,
      nameTextStyle: { color: P.subText, padding: [0, 0, 0, 0] },
      axisLabel: { color: P.subText, fontSize: 11 },
      splitLine: { lineStyle: { color: P.splitLine } },
      scale: true
    },
    series: ecSeries.map(({ _raw, _t, ...rest }) => rest)
  };
  return opt;
}

/** 简单柱状图（近14天构建趋势 / 24h 请求等） */
export function buildBarOption(categories, values, { dark, color = '#2f6bff', name = '' } = {}) {
  const P = chartPalette(dark);
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: P.tooltipBg,
      borderColor: P.tooltipBorder,
      textStyle: { color: P.text, fontSize: 12 },
      valueFormatter: (v) => formatCount(v)
    },
    grid: { left: 8, right: 12, top: 18, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: P.axisLine } },
      axisTick: { show: false },
      axisLabel: { color: P.subText, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: P.subText, fontSize: 11 },
      splitLine: { lineStyle: { color: P.splitLine } }
    },
    series: [
      {
        name,
        type: 'bar',
        data: values,
        barMaxWidth: 26,
        itemStyle: { color, borderRadius: [3, 3, 0, 0] },
        label: { show: false }
      }
    ]
  };
}

/** 注册世界/中国地图（幂等，只加载一次） */
let mapsLoaded = false;
let mapsLoading = null;
export function ensureMaps() {
  if (mapsLoaded) return Promise.resolve();
  if (mapsLoading) return mapsLoading;
  mapsLoading = Promise.all([
    fetch('/geo/world.json').then((r) => r.json()).then((geo) => {
      echarts.registerMap('world', geo);
    }),
    fetch('/geo/china.json').then((r) => r.json()).then((geo) => {
      echarts.registerMap('china', geo);
    })
  ])
    .then(() => {
      mapsLoaded = true;
    })
    .catch((e) => {
      mapsLoading = null;
      throw e;
    });
  return mapsLoading;
}

/**
 * 地图 option
 * data: [{name, value}]（name 需与地图 feature 对齐）
 */
export function buildMapOption(mapName, data, { dark, title, unit = 'count' } = {}) {
  const P = chartPalette(dark);
  const maxVal = Math.max(...data.map((d) => d.value), 0);
  const nameMap = mapName === 'world' ? worldNameMap : undefined;
  const vmFmt = (v) => {
    if (unit === 'bytes') return formatBytes(v);
    if (unit === 'bps') return formatSpeed(v);
    return formatCount(v);
  };

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: P.tooltipBg,
      borderColor: P.tooltipBorder,
      textStyle: { color: P.text, fontSize: 12 },
      formatter: (p) => {
        const v = p.value && Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value;
        return `<div style="font-weight:600">${p.name}</div><div style="margin-top:2px">${v == null ? '暂无数据' : fmtVal(unit, v, 1)}</div>`;
      }
    },
    visualMap: {
      min: 0,
      max: maxVal || 1,
      left: 'left',
      bottom: 6,
      calculable: true,
      itemWidth: 12,
      itemHeight: 80,
      text: ['高', '低'],
      textStyle: { color: P.subText, fontSize: 11 },
      formatter: (v) => vmFmt(v),
      inRange: { color: [P.visualMin, P.visualMax] }
    },
    series: [
      {
        name: title || '分布',
        type: 'map',
        map: mapName,
        roam: true,
        scaleLimit: { min: 0.7, max: 8 },
        nameMap,
        layoutCenter: ['50%', '50%'],
        layoutSize: mapName === 'world' ? '118%' : '100%',
        label: { show: false, color: P.text, fontSize: 9 },
        itemStyle: {
          areaColor: P.mapEmpty,
          borderColor: P.mapBorder,
          borderWidth: 0.5
        },
        emphasis: {
          label: { show: true, color: P.text, fontSize: 10 },
          itemStyle: { areaColor: P.visualMax, borderColor: P.mapEmphasis }
        },
        select: { label: { show: true }, itemStyle: { areaColor: P.visualMax } },
        data
      }
    ]
  };
}
