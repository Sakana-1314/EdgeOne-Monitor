/**
 * src/config/theme.js —— 主题令牌（GitHub Primer 配色）+ NaiveUI 覆盖 + 小圆角
 */
export const PALETTES = {
  light: {
    bg: '#ffffff', // canvas.default
    card: '#ffffff', // 卡片/面板
    subtle: '#f6f8fa', // canvas.subtle（hover、次级填充）
    border: '#d0d7de', // border.default
    text1: '#1f2328', // fg.default
    text2: '#57606a', // fg.muted
    text3: '#656d76', // fg.subtle
    fill1: '#f6f8fa',
    hover: '#f3f4f6',
    primary: '#0969da', // accent.fg
    primaryHover: '#0a7ee8',
    primaryPressed: '#0759c2',
    info: '#0969da',
    success: '#1a7f37',
    warning: '#9a6700',
    error: '#cf222e'
  },
  dark: {
    bg: '#0d1117', // canvas.default
    card: '#161b22', // canvas.subtle（GitHub 面板）
    subtle: '#161b22',
    border: '#30363d', // border.default
    text1: '#e6edf3', // fg.default
    text2: '#adbac7', // fg.muted 略调亮保可读
    text3: '#7d8590', // fg.subtle
    fill1: '#21262d', // 输入/按钮次级填充
    hover: '#21262d',
    primary: '#2f81f7', // accent
    primaryHover: '#388bfd',
    primaryPressed: '#1f6feb',
    info: '#2f81f7',
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149'
  }
};

/** NaiveUI themeOverrides（跟随 light/dark，GitHub 风格） */
export function naiveOverrides(dark) {
  const t = PALETTES[dark ? 'dark' : 'light'];
  return {
    common: {
      primaryColor: t.primary,
      primaryColorHover: t.primaryHover,
      primaryColorPressed: t.primaryPressed,
      primaryColorSuppl: t.primaryHover,
      infoColor: t.info,
      successColor: t.success,
      warningColor: t.warning,
      errorColor: t.error,
      bodyColor: t.bg,
      cardColor: t.card,
      modalColor: dark ? '#161b22' : '#ffffff',
      popoverColor: dark ? '#161b22' : '#ffffff',
      tableColor: t.card,
      inputColor: dark ? '#0d1117' : '#ffffff',
      inputColorDisabled: dark ? '#161b22' : '#f6f8fa',
      borderColor: t.border,
      dividerColor: t.border,
      textColorBase: t.text1,
      textColor1: t.text1,
      textColor2: t.text2,
      textColor3: t.text3,
      borderRadius: '6px',
      fontSize: '14px'
    },
    Card: { color: t.card, borderColor: t.border, colorModal: t.card, borderRadius: '6px' },
    Menu: { borderRadius: '6px' },
    Button: { borderRadiusMedium: '6px', borderRadiusSmall: '6px' }
  };
}

/** 同步写入 CSS 变量（供自定义组件使用，含小圆角令牌） */
export function applyCssTokens(dark) {
  const t = PALETTES[dark ? 'dark' : 'light'];
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  const map = {
    '--eo-bg': t.bg,
    '--eo-card': t.card,
    '--eo-subtle': t.subtle,
    '--eo-border': t.border,
    '--eo-text-1': t.text1,
    '--eo-text-2': t.text2,
    '--eo-text-3': t.text3,
    '--eo-fill-1': t.fill1,
    '--eo-hover': t.hover,
    '--eo-primary': t.primary,
    '--eo-success': t.success,
    '--eo-error': t.error,
    '--eo-warning': t.warning,
    '--eo-radius': '6px',
    '--eo-radius-lg': '12px'
  };
  Object.entries(map).forEach(([k, v]) => root.style.setProperty(k, v));
}
