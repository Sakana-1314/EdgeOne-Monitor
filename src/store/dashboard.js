/**
 * src/store/dashboard.js —— 全局查询条件：时间范围 / 粒度 / 站点 / 自动刷新
 */
import { defineStore } from 'pinia';
import { api } from '../api/index.js';
import { getToken } from '../api/http.js';

export const RANGES = [
  { key: '30m', label: '近 30 分钟' },
  { key: '1h', label: '近 1 小时' },
  { key: '3h', label: '近 3 小时' },
  { key: '6h', label: '近 6 小时' },
  { key: '12h', label: '近 12 小时' },
  { key: '24h', label: '近 24 小时' },
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: '3d', label: '近 3 天' },
  { key: '7d', label: '近 7 天' },
  { key: '14d', label: '近 14 天' },
  { key: '31d', label: '近 31 天' },
  { key: 'custom', label: '自定义' }
];

export const INTERVALS = [
  { key: 'auto', label: '自动' },
  { key: 'min', label: '1 分钟' },
  { key: '5min', label: '5 分钟' },
  { key: 'hour', label: '1 小时' },
  { key: 'day', label: '1 天' }
];

const DUR = {
  '30m': 30 * 60 * 1000,
  '1h': 3600 * 1000,
  '3h': 3 * 3600 * 1000,
  '6h': 6 * 3600 * 1000,
  '12h': 12 * 3600 * 1000,
  '24h': 24 * 3600 * 1000,
  '3d': 3 * 86400 * 1000,
  '7d': 7 * 86400 * 1000,
  '14d': 14 * 86400 * 1000,
  '31d': 31 * 86400 * 1000
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function iso(ms) {
  return new Date(ms).toISOString().slice(0, 19) + 'Z';
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    rangeKey: '24h',
    custom: { d: 0, h: 0, m: 0 },
    interval: 'auto',
    zoneId: '',
    zones: [],
    autoRefresh: 0, // 0=关闭；单位秒
    revision: 0,
    refreshedAt: 0
  }),
  getters: {
    rangeLabel(state) {
      const r = RANGES.find((x) => x.key === state.rangeKey);
      return r ? r.label : '自定义';
    },
    zonesWithAll(state) {
      return [{ id: '', name: '全部站点' }, ...state.zones];
    }
  },
  actions: {
    rangeDur() {
      return DUR[this.rangeKey] || 0;
    },
    /** 当前查询窗口（UTC ISO）。capDays 用于限制最大跨度（如安全指标 14 天） */
    getWindow({ capDays } = {}) {
      const now = Date.now();
      let startMs;
      let endMs = now;
      const range = this.rangeKey;

      if (range === 'today') {
        startMs = startOfToday();
      } else if (range === 'yesterday') {
        endMs = startOfToday() - 1;
        startMs = endMs - (86400000 - 1);
      } else {
        const dur = range === 'custom' ? this.customDurMs() : this.rangeDur();
        startMs = now - (dur || 3600000);
      }

      if (capDays) {
        const capMs = capDays * 86400000;
        if (endMs - startMs > capMs) startMs = endMs - capMs;
      }
      if (endMs <= startMs) endMs = startMs + 3600000;

      return {
        startMs,
        endMs,
        startISO: iso(startMs),
        endISO: iso(endMs),
        interval: this.interval,
        zoneId: this.zoneId
      };
    },
    bump() {
      this.revision += 1;
      this.refreshedAt = Date.now();
    },
    setRange(key) {
      if (!RANGES.find((r) => r.key === key)) return;
      this.rangeKey = key;
      this.bump();
    },
    applyCustom({ d = 0, h = 0, m = 0 }) {
      this.custom = { d: Math.max(0, d | 0), h: Math.max(0, h | 0), m: Math.max(0, m | 0) };
      this.rangeKey = 'custom';
      this.bump();
    },
    customDurMs() {
      const c = this.custom;
      return ((c.d * 24 + c.h) * 60 + c.m) * 60000;
    },
    setInterval(iv) {
      this.interval = iv;
      this.bump();
    },
    setZone(id) {
      this.zoneId = id || '';
      this.bump();
    },
    setAutoRefresh(sec) {
      this.autoRefresh = Number(sec) || 0;
    },
    async loadZones() {
      if (!getToken()) return;
      try {
        const data = await api.zones();
        this.zones = (data.zones || []).map((z) => ({ id: z.id, name: z.name, area: z.area }));
      } catch {
        /* 忽略：继续用空站点列表 */
      }
    }
  }
});
