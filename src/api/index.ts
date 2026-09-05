/**
 * src/api/index.ts —— 后端接口
 */
import { http } from './http';
import type {
  ConfigData,
  HealthData,
  LoginData,
  MeData,
  MetricsData,
  MetricsQuery,
  PagesBuildData,
  PagesCfRequestsData,
  PagesCfMonthlyData,
  ZonesData
} from '../types/model';

export const api = {
  // 应用配置
  config: (): Promise<ConfigData> => http.get('/api/config'),
  health: (): Promise<HealthData> => http.get('/api/health'),

  // 鉴权
  login: (username: string, password: string): Promise<LoginData> => http.post('/api/auth/login', { username, password }),
  me: (): Promise<MeData> => http.get('/api/auth/me'),

  // 数据
  zones: (): Promise<ZonesData> => http.get('/api/zones'),
  /**
   * 批量取指标
   * @param names 指标 id 列表
   * @param o     { startISO, endISO, interval, zoneId, compare }
   */
  metrics: (names: string[], o: MetricsQuery = {}): Promise<MetricsData> =>
    http.get('/api/metrics', {
      names: names.join(','),
      startTime: o.startISO,
      endTime: o.endISO,
      interval: o.interval,
      zoneId: o.zoneId,
      compare: o.compare ? '1' : ''
    }),

  // Pages
  pagesBuild: (zoneId?: string): Promise<PagesBuildData> => http.get('/api/pages/build-count', { zoneId }),
  pagesCfRequests: (zoneId: string | undefined, o: { startISO?: string; endISO?: string } = {}): Promise<PagesCfRequestsData> =>
    http.get('/api/pages/cf-requests', { zoneId, startTime: o.startISO, endTime: o.endISO }),
  pagesCfMonthly: (zoneId?: string): Promise<PagesCfMonthlyData> => http.get('/api/pages/cf-monthly', { zoneId })
};
