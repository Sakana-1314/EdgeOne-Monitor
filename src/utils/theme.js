/**
 * src/utils/theme.js —— 浅/深色图表调色
 */
export function chartPalette(dark) {
  return {
    dark,
    text: dark ? '#adbac7' : '#57606a',
    subText: dark ? '#7d8590' : '#656d76',
    axisLine: dark ? '#30363d' : '#d0d7de',
    splitLine: dark ? '#21262d' : '#d8dee4',
    tooltipBg: dark ? 'rgba(22,27,34,0.96)' : 'rgba(255,255,255,0.98)',
    tooltipBorder: dark ? '#30363d' : '#d0d7de',
    legend: dark ? '#adbac7' : '#57606a',
    mapEmpty: dark ? '#21262d' : '#eaeef2',
    mapBorder: dark ? '#30363d' : '#d0d7de',
    mapEmphasis: dark ? '#161b22' : '#ffffff',
    visualMin: dark ? '#162c47' : '#d6e6ff',
    visualMax: dark ? '#2f81f7' : '#0969da'
  };
}

/** 常见折线色板（避免与系列主题色冲突时的兜底） */
export const LINE_COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#84cc16'];
