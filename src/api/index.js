/**
 * src/api/index.js —— 后端接口
 */
import { http } from './http.js';

export const api = {
  // 应用配置
  config: () => http.get('/api/config'),
  health: () => http.get('/api/health'),

  // 鉴权
  login: (username, password) => http.post('/api/auth/login', { username, password }),
  me: () => http.get('/api/auth/me'),

  // 数据
  zones: () => http.get('/api/zones'),
  /**
   * 批量取指标
   * @param {string[]} names
   * @param {object} o { startISO, endISO, interval, zoneId, compare }
   */
  metrics: (names, o = {}) =>
    http.get('/api/metrics', {
      names: names.join(','),
      startTime: o.startISO,
      endTime: o.endISO,
      interval: o.interval,
      zoneId: o.zoneId,
      compare: o.compare ? '1' : ''
    }),

  // Pages
  pagesBuild: (zoneId) => http.get('/api/pages/build-count', { zoneId }),
  pagesCfRequests: (zoneId, o = {}) =>
    http.get('/api/pages/cf-requests', { zoneId, startTime: o.startISO, endTime: o.endISO }),
  pagesCfMonthly: (zoneId) => http.get('/api/pages/cf-monthly', { zoneId })
};
