/**
 * src/config/tabs.ts —— 左侧导航 Tab 定义（地区分布 作为第一个 Tab）
 * icon: @vicons/ionicons5 组件名，由布局映射
 */

/** 导航 Tab 定义 */
export interface TabDef {
  key: string;
  path: string;
  label: string;
  title: string;
  /** @vicons/ionicons5 导出名（由布局层映射为组件） */
  icon: string;
  desc: string;
}

export const TABS: TabDef[] = [
  {
    key: 'region',
    path: '/region',
    label: '地区分布',
    title: '地区分布',
    icon: 'EarthOutline',
    desc: '全球/国内地图分布 · 国家与省份流量、请求排行'
  },
  {
    key: 'traffic',
    path: '/traffic',
    label: '流量与带宽',
    title: '流量与带宽',
    icon: 'PulseOutline',
    desc: '总/入/出流量与带宽趋势'
  },
  {
    key: 'requests',
    path: '/requests',
    label: '请求与性能',
    title: '请求与性能',
    icon: 'StatsChartOutline',
    desc: '请求数、响应耗时、首字节耗时趋势'
  },
  {
    key: 'origin',
    path: '/origin',
    label: '回源分析',
    title: '回源分析',
    icon: 'GitNetworkOutline',
    desc: '回源流量/带宽/请求数与缓存命中'
  },
  {
    key: 'security',
    path: '/security',
    label: '安全防护',
    title: '安全防护',
    icon: 'ShieldCheckmarkOutline',
    desc: 'DDoS/CC 精确、托管、速率限制拦截'
  },
  {
    key: 'edge-functions',
    path: '/edge-functions',
    label: '边缘函数',
    title: '边缘函数',
    icon: 'ConstructOutline',
    desc: 'Edge Functions 请求数与 CPU 耗时'
  },
  {
    key: 'pages',
    path: '/pages',
    label: 'Pages 应用',
    title: 'Pages 应用',
    icon: 'AlbumsOutline',
    desc: 'Pages 构建与 Cloud Functions 用量'
  },
  {
    key: 'top-analysis',
    path: '/top-analysis',
    label: 'TOP 排行',
    title: 'TOP 排行',
    icon: 'TrophyOutline',
    desc: '状态码/域名/URL/资源类型/客户端IP/Referer/UA 等细分排行'
  }
];

export const tabByPath = (p: string): TabDef | undefined => TABS.find((t) => t.path === p);
