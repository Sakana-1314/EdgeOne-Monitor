/**
 * src/store/app.ts —— 全局应用状态：主题 / 配置 / 登录
 */
import { defineStore } from 'pinia';
import { api } from '../api/index';
import { getToken, setToken, clearToken } from '../api/http';
import { errText } from '../utils/format';
import type { LoginData, LoginUser } from '../types/model';

const THEME_KEY = 'eo_theme'; // light | dark | auto

export type ThemeMode = 'light' | 'dark' | 'auto';

function systemDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    themeMode: (localStorage.getItem(THEME_KEY) || 'auto') as ThemeMode,
    siteName: 'EdgeOne 监控大屏',
    siteIcon: '',
    version: '',
    configured: false,
    token: getToken(),
    user: null as LoginUser | null,
    booted: false,
    bootError: '',
    _tick: 0
  }),
  getters: {
    effectiveTheme(state): 'light' | 'dark' {
      void state._tick; // 主题由系统变化后强制重算
      return state.themeMode === 'auto' ? (systemDark() ? 'dark' : 'light') : state.themeMode;
    },
    isDark(): boolean {
      return this.effectiveTheme === 'dark';
    },
    isLoggedIn(): boolean {
      return Boolean(this.token);
    }
  },
  actions: {
    applyThemeClass(): void {
      const dark = this.effectiveTheme === 'dark';
      const el = document.documentElement;
      el.classList.toggle('dark', dark);
      el.setAttribute('data-theme', dark ? 'dark' : 'light');
    },
    setThemeMode(mode: ThemeMode): void {
      this.themeMode = mode;
      localStorage.setItem(THEME_KEY, mode);
      this.applyThemeClass();
    },
    /** 系统主题变化后强制刷新有效主题 */
    notifyTheme(): void {
      this._tick += 1;
      this.applyThemeClass();
    },
    toggleTheme(): void {
      this.setThemeMode(this.isDark ? 'light' : 'dark');
    },
    /** 拉取应用配置（无需登录） */
    async boot(): Promise<void> {
      try {
        const data = await api.config();
        this.siteName = data.siteName || this.siteName;
        this.siteIcon = data.siteIcon || '';
        this.version = data.version;
        this.configured = Boolean(data.configured);
      } catch (e) {
        this.bootError = errText(e);
      } finally {
        this.booted = true;
        this.applyThemeClass();
      }
    },
    async login(username: string, password: string): Promise<LoginData> {
      const data = await api.login(username, password);
      this.token = data.token;
      this.user = data.user || null;
      setToken(data.token);
      return data;
    },
    logout(): void {
      this.token = '';
      this.user = null;
      clearToken();
    }
  }
});
