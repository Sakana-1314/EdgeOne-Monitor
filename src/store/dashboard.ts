/**
 * src/store/dashboard.ts —— 全局查询条件：时间范围 / 粒度 / 站点 / 自动刷新
 */
import { defineStore } from 'pinia';
import { api } from '../api/index';
import { getToken } from '../api/http';
import type { CustomRange, RangeKey, Zone } from '../types/model';

/** 时间范围选项 */
export interface RangeOption {
  key: RangeKey;
  label: string;
}

/** 数据粒度选项 */
export interface IntervalOption {
  key: string;
  label: string;
}

export const RANGES: RangeOption[] = [
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

export const INTERVALS: IntervalOption[] = [
  { key: 'auto', label: '自动' },
  { key: 'min', label: '1 分钟' },
  { key: '5min', label: '5 分钟' },
  { key: 'hour', label: '1 小时' },
  { key: 'day', label: '1 天' }
];

const STORE_KEY = 'eo_dash_state';

const AUTO_VALUES = [0, 30, 60, 300];

/** 本地记忆的持久化形态（字段均需在加载时校验） */
interface PersistedState {
  rangeKey?: RangeKey;
  interval?: string;
  zoneId?: string;
  autoRefresh?: number;
  custom?: CustomRange;
}

function clampInt(v: unknown, lo: number, hi: number): number {
  const n = Math.max(lo, Math.min(hi, Number(v) || lo));
  return Math.round(n);
}

/** 读取本地记忆（只取合法值） */
function loadPersisted(): Partial<PersistedState> {
  try {
    const raw = (JSON.parse(localStorage.getItem(STORE_KEY) || 'null') || {}) as Record<string, unknown>;
    const out: Partial<PersistedState> = {};
    if (raw.rangeKey === 'custom' || RANGES.some((r) => r.key === raw.rangeKey)) out.rangeKey = raw.rangeKey as RangeKey;
    if (INTERVALS.some((i) => i.key === raw.interval)) out.interval = raw.interval as string;
    if (typeof raw.zoneId === 'string') out.zoneId = raw.zoneId;
    const ar = raw.autoRefresh;
    if (typeof ar === 'number' && AUTO_VALUES.includes(ar)) out.autoRefresh = ar;
    const c = raw.custom;
    if (c && typeof c === 'object' && Number.isFinite(Number((c as { d?: unknown }).d))) {
      const cd = c as { d?: unknown; h?: unknown; m?: unknown };
      out.custom = {
        d: clampInt(cd.d, 0, 31),
        h: clampInt(cd.h, 0, 23),
        m: clampInt(cd.m, 0, 59)
      };
    }
    return out;
  } catch {
    return {};
  }
}

const DUR: Partial<Record<RangeKey, number>> = {
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

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function iso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19) + 'Z';
}

/** 查询窗口（毫秒边界 + UTC ISO + 粒度/站点） */
export interface QueryWindow {
  startMs: number;
  endMs: number;
  startISO: string;
  endISO: string;
  interval: string;
  zoneId: string;
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    rangeKey: '24h' as RangeKey,
    custom: { d: 0, h: 0, m: 0 } as CustomRange,
    interval: 'auto',
    zoneId: '',
    zones: [] as Zone[],
    autoRefresh: 0, // 0=关闭；单位秒
    revision: 0,
    refreshedAt: 0,
    ...loadPersisted()
  }),
  getters: {
    rangeLabel(state): string {
      const r = RANGES.find((x) => x.key === state.rangeKey);
      return r ? r.label : '自定义';
    },
    zonesWithAll(state): Zone[] {
      return [{ id: '', name: '全部站点' }, ...state.zones];
    }
  },
  actions: {
    rangeDur(): number {
      return DUR[this.rangeKey] || 0;
    },
    /** 当前查询窗口（UTC ISO）。capDays 用于限制最大跨度（如安全指标 14 天） */
    getWindow({ capDays }: { capDays?: number } = {}): QueryWindow {
      const now = Date.now();
      let startMs: number;
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
    bump(): void {
      this.revision += 1;
      this.refreshedAt = Date.now();
    },
    persist(): void {
      try {
        localStorage.setItem(
          STORE_KEY,
          JSON.stringify({ rangeKey: this.rangeKey, interval: this.interval, zoneId: this.zoneId, autoRefresh: this.autoRefresh, custom: this.custom })
        );
      } catch {
        /* 忽略（隐私模式等） */
      }
    },
    setRange(key: RangeKey): void {
      if (!RANGES.find((r) => r.key === key)) return;
      this.rangeKey = key;
      this.persist();
      this.bump();
    },
    applyCustom(c: { d?: number; h?: number; m?: number } = {}): void {
      this.custom = { d: Math.max(0, (c.d || 0) | 0), h: Math.max(0, (c.h || 0) | 0), m: Math.max(0, (c.m || 0) | 0) };
      this.rangeKey = 'custom';
      this.persist();
      this.bump();
    },
    customDurMs(): number {
      const c = this.custom;
      return ((c.d * 24 + c.h) * 60 + c.m) * 60000;
    },
    setInterval(iv: string): void {
      this.interval = iv;
      this.persist();
      this.bump();
    },
    setZone(id: string): void {
      this.zoneId = id || '';
      this.persist();
      this.bump();
    },
    setAutoRefresh(sec: number | string): void {
      this.autoRefresh = Number(sec) || 0;
      this.persist();
    },
    async loadZones(): Promise<void> {
      if (!getToken()) return;
      try {
        const data = await api.zones();
        this.zones = (data.zones || []).map((z) => ({ id: z.id, name: z.name, area: z.area }));
        // 记忆的站点已被移除/不在白名单时回退到「全部站点」
        if (this.zoneId && !this.zones.some((z) => z.id === this.zoneId)) {
          this.zoneId = '';
          this.persist();
        }
      } catch {
        /* 忽略：继续用空站点列表 */
      }
    }
  }
});
