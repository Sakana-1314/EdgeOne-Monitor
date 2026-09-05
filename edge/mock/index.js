/**
 * edge/mock/index.js —— 演示数据(DEMO) Provider
 * 无腾讯云凭据时自动启用；也可通过 DATA_MODE=mock 强制启用。
 * 对外接口与 edge/teo.js（真实 Provider）保持一致。
 */

import { MOCK_ZONES, generateMetrics, generateMetric } from './generator.js';

export async function listZones() {
  return MOCK_ZONES;
}

export async function fetchMetrics(_env, ids, opts) {
  return generateMetrics(ids, opts);
}

export async function fetchSingleMetric(id, opts) {
  return generateMetric(id, opts);
}

/** Pages 构建统计：当日/当月 + 近 14 天每日构建趋势（演示值，随当天日期变化） */
export async function fetchPagesBuild(env, zoneId) {
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const dayNum = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const seed = (now.getFullYear() * 1000 + now.getMonth() * 50 + now.getDate() * 3) % 997;
  const daily = 2 + ((seed * 7) % 12); // 每日 2~13 次
  const monthly = daily + ((seed * 13 + dayNum * 5) % 60); // 当月累计
  const trend = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const k = (d.getDate() * 31 + (d.getMonth() + 1) * 7 + d.getFullYear()) % 11;
    trend.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, v: 1 + k });
  }
  return {
    dailyBuilds: daily,
    monthlyBuilds: monthly,
    monthProgress: Math.min(100, Math.round((dayNum / totalDaysInMonth) * 100)),
    dayKey,
    monthKey,
    trend
  };
}

/** Pages Cloud Functions 请求趋势：近 24 小时逐小时请求数 */
export async function fetchPagesCfRequests(env, zoneId) {
  const end = new Date();
  const points = [];
  for (let i = 23; i >= 0; i--) {
    const t = end.getTime() - i * 3600000;
    const h = new Date(t).getHours();
    const w = 0.45 + 0.55 * Math.sin(((h - 4) / 24) * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5;
    const base = 2600 * Math.max(0.2, w);
    const jitter = 0.8 + ((t / 3600000 + 3) % 1.0);
    points.push({ t, v: Math.round(base * (0.8 + jitter * 0.4)) });
  }
  return { points };
}

/** Pages Cloud Functions 月度统计 */
export async function fetchPagesCfMonthly(env, zoneId) {
  const now = new Date();
  const seed = (now.getMonth() * 1000 + now.getDate() * 7 + now.getFullYear()) % 991;
  const dayNum = now.getDate();
  return {
    monthlyRequests: Math.round((5.6 + (seed % 50) / 40) * dayNum * 1e4),
    monthlyGbs: Math.round((6.2 + (seed % 40) / 30) * dayNum),
    cf24hRequests: 2600 * 24 * 0.75
  };
}
