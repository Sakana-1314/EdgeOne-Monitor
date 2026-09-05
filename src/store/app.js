/**
 * src/store/app.js —— 全局应用状态：主题 / 配置 / 登录
 */
import { defineStore } from 'pinia';
import { api } from '../api/index.js';
import { getToken, setToken, clearToken } from '../api/http.js';

const THEME_KEY = 'eo_theme'; // light | dark | auto

function systemDark() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export const useAppStore = defineStore('app', {
  state: () => ({
    themeMode: localStorage.getItem(THEME_KEY) || 'auto',
    siteName: 'EdgeOne 监控大屏',
    siteIcon: '',
    version: '',
    configured: false,
    token: getToken(),
    user: null,
    booted: false,
    bootError: '',
    _tick: 0
  }),
  getters: {
    effectiveTheme(state) {
      void state._tick; // 主题由系统变化后强制重算
      return state.themeMode === 'auto' ? (systemDark() ? 'dark' : 'light') : state.themeMode;
    },
    isDark() {
      return this.effectiveTheme === 'dark';
    },
    isLoggedIn(state) {
      return Boolean(state.token);
    }
  },
  actions: {
    applyThemeClass() {
      const dark = this.effectiveTheme === 'dark';
      const el = document.documentElement;
      el.classList.toggle('dark', dark);
      el.setAttribute('data-theme', dark ? 'dark' : 'light');
    },
    setThemeMode(mode) {
      this.themeMode = mode;
      localStorage.setItem(THEME_KEY, mode);
      this.applyThemeClass();
    },
    /** 系统主题变化后强制刷新有效主题 */
    notifyTheme() {
      this._tick += 1;
      this.applyThemeClass();
    },
    toggleTheme() {
      this.setThemeMode(this.isDark ? 'light' : 'dark');
    },
    /** 拉取应用配置（无需登录） */
    async boot() {
      try {
        const data = await api.config();
        this.siteName = data.siteName || this.siteName;
        this.siteIcon = data.siteIcon || '';
        this.version = data.version;
        this.configured = Boolean(data.configured);
      } catch (e) {
        this.bootError = e.message;
      } finally {
        this.booted = true;
        this.applyThemeClass();
      }
    },
    async login(username, password) {
      const data = await api.login(username, password);
      this.token = data.token;
      this.user = data.user;
      setToken(data.token);
      return data;
    },
    logout() {
      this.token = '';
      this.user = null;
      clearToken();
    }
  }
});
