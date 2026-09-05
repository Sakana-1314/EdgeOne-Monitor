/**
 * src/utils/theme.js —— 浅/深色图表调色
 */
export function chartPalette(dark) {
  return {
    dark,
    text: dark ? '#cbd5e1' : '#334155',
    subText: dark ? '#94a3b8' : '#64748b',
    axisLine: dark ? '#475569' : '#cbd5e1',
    splitLine: dark ? '#293548' : '#e9eef5',
    tooltipBg: dark ? 'rgba(15,23,42,0.94)' : 'rgba(255,255,255,0.96)',
    tooltipBorder: dark ? '#334155' : '#e2e8f0',
    legend: dark ? '#cbd5e1' : '#334155',
    mapEmpty: dark ? '#1b2436' : '#eef2f7',
    mapBorder: dark ? '#334155' : '#cbd5e1',
    mapEmphasis: dark ? '#0f172a' : '#ffffff',
    visualMin: dark ? '#17304d' : '#e0f0ff',
    visualMax: dark ? '#38bdf8' : '#1d4ed8'
  };
}

/** 常见折线色板（避免与系列主题色冲突时的兜底） */
export const LINE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16'];
