/**
 * src/config/theme.js —— 主题令牌 + NaiveUI 覆盖
 */
export const PALETTES = {
  light: {
    bg: '#eef1f6',
    card: '#ffffff',
    border: 'rgba(15,23,42,0.08)',
    text1: '#111827',
    text2: '#4b5563',
    text3: '#9aa3af',
    fill1: '#f1f5f9',
    hover: '#f8fafc',
    primary: '#2f6bff',
    primaryHover: '#5b8bff',
    primaryPressed: '#1e4fd6',
    info: '#2f6bff',
    success: '#18a058',
    warning: '#f0a020',
    error: '#d03050'
  },
  dark: {
    bg: '#0a0e16',
    card: '#141a27',
    border: 'rgba(148,163,184,0.14)',
    text1: '#e6edf6',
    text2: '#94a3b8',
    text3: '#64748b',
    fill1: '#1c2434',
    hover: '#1a2233',
    primary: '#4c8dff',
    primaryHover: '#6ba2ff',
    primaryPressed: '#2f6bff',
    info: '#4c8dff',
    success: '#63e2b7',
    warning: '#f0c060',
    error: '#e88080'
  }
};

/** NaiveUI themeOverrides（跟随 light/dark） */
export function naiveOverrides(dark) {
  const t = PALETTES[dark ? 'dark' : 'light'];
  return {
    common: {
      primaryColor: t.primary,
      primaryColorHover: t.primaryHover,
      primaryColorPressed: t.primaryPressed,
      primaryColorSuppl: t.primaryHover,
      infoColor: t.info,
      bodyColor: t.bg,
      cardColor: t.card,
      modalColor: t.card,
      popoverColor: dark ? '#1b2333' : '#ffffff',
      tableColor: t.card,
      borderColor: t.border,
      dividerColor: t.border,
      textColorBase: t.text1,
      textColor1: t.text1,
      textColor2: t.text2,
      textColor3: t.text3,
      fontSize: '14px'
    },
    Card: { color: t.card, borderColor: t.border, colorModal: t.card }
  };
}

/** 同步写入 CSS 变量（供自定义组件使用） */
export function applyCssTokens(dark) {
  const t = PALETTES[dark ? 'dark' : 'light'];
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  const map = {
    '--eo-bg': t.bg,
    '--eo-card': t.card,
    '--eo-border': t.border,
    '--eo-text-1': t.text1,
    '--eo-text-2': t.text2,
    '--eo-text-3': t.text3,
    '--eo-fill-1': t.fill1,
    '--eo-hover': t.hover,
    '--eo-primary': t.primary
  };
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}
