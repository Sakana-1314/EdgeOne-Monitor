/**
 * edge/mock/generator.js
 * 演示数据(DEMO) 生成器：确定性、随时间平滑变化、按站点缩放。
 * 生成的指标结构与“真实数据 Provider”归一化后完全一致，便于前端无差别使用。
 */

import { METRIC, UNIT, KIND } from '../registry.js';

/** 字符串 -> 32位整数种子 */
function strSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 伪随机数生成器 */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash01(str) {
  return strSeed(str) / 4294967295;
}

/** 站点 -> 数据量缩放系数（选择不同站点模拟聚合差异） */
export const ZONE_FACTOR = {
  '*': 1,
  'demo-zone-main': 0.62,
  'demo-zone-func': 0.18,
  'demo-zone-pages': 0.08,
  'default-pages-zone': 0.08
};

export const MOCK_ZONES = [
  { id: 'demo-zone-main', name: '主站 www.demo.example', area: '演示' },
  { id: 'demo-zone-func', name: '边缘函数站 fn.demo.example', area: '演示' },
  { id: 'demo-zone-pages', name: 'Pages 站 pages.demo.example', area: '演示' },
  { id: 'default-pages-zone', name: 'default-pages-zone (Pages站点)', area: '演示' }
];

const DAY = 86400000;

function factorOf(zoneIds) {
  const z = Array.isArray(zoneIds) && zoneIds.length ? zoneIds[0] : '*';
  return ZONE_FACTOR[z] ?? 1;
}

/** 每日流量形态：白天高、凌晨低，含 3 个平滑峰 */
function wave(t) {
  const h = (new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60);
  const day = (0.62 + 0.38 * Math.sin(((h - 3) / 24) * Math.PI * 2 - Math.PI / 2)) * 0.5 + 0.5;
  const week = new Date(t).getUTCDay();
  const wk = week === 0 || week === 6 ? 0.82 : 1;
  const trend = 1 + 0.06 * Math.sin((t / DAY / 9) * Math.PI * 2 + 1.3);
  return Math.max(0.15, day) * wk * trend;
}

function stepOf(interval, ms) {
  const sec = { min: 60, '5min': 300, hour: 3600, day: 86400 };
  if (sec[interval]) return sec[interval];
  const h = ms / 3600000;
  if (h <= 1) return 60;
  if (h <= 6) return 300;
  if (h <= 72) return 3600;
  return 86400;
}

/** 区间 -> 采样点对齐（返回毫秒时间点数组） */
function genTimes(startMs, endMs, interval) {
  const stepSec = stepOf(interval, endMs - startMs);
  const step = stepSec * 1000;
  const out = [];
  let cur = Math.floor(startMs / step) * step;
  // 保证覆盖起点
  if (cur < startMs) cur += step;
  while (cur <= endMs) {
    out.push(cur);
    cur += step;
  }
  if (!out.length) out.push(Math.floor((startMs + endMs) / 2 / step) * step);
  return out;
}

/**
 * 生成单条时序指标
 */
function genTimeMetric(id, { startMs, endMs, interval, zoneIds }) {
  const meta = METRIC[id];
  const unit = meta.unit;
  const factor = factorOf(zoneIds);
  const base = meta.mockScale * factor;
  const times = genTimes(startMs, endMs, interval);
  const seedKey = `${id}|${zoneIds?.join(',')}|${Math.floor(startMs / (6 * 3600000))}`;

  // 是否按每秒速率累积
  const integral =
    unit === UNIT.BYTES || unit === UNIT.COUNT || (unit === UNIT.MS && id === 'function_cpuCostTime');
  const instantaneous = unit === UNIT.BPS || (unit === UNIT.MS && !integral);

  const rand = mulberry32(strSeed(seedKey));
  const points = times.map((t, i) => {
    const w = wave(t);
    const slow = 0.82 + 0.18 * Math.sin((t / 3600000 / 5.3) * Math.PI * 2 + hash01(id) * 6.28);
    const jitter = 0.78 + rand() * 0.44;
    let v;
    if (instantaneous) {
      v = base * (0.45 + 0.75 * w) * (0.7 + 0.3 * slow) * jitter;
    } else {
      const step = i > 0 ? (t - times[i - 1]) / 1000 : stepOf(interval, endMs - startMs);
      v = base * (0.3 + 0.7 * w) * (0.75 + 0.25 * slow) * jitter * step;
    }
    return { t, v: Math.max(0, Math.round(v * 100) / 100) };
  });

  // 无积分(瞬时)指标：取均值/最大作为统计；积分指标：求和
  let sum;
  if (instantaneous) {
    sum = Math.round(points.reduce((a, p) => a + p.v, 0) / Math.max(1, points.length));
  } else {
    sum = Math.round(points.reduce((a, p) => a + p.v, 0));
  }
  const max = Math.round(points.reduce((a, p) => Math.max(a, p.v), 0));
  const avg = Math.round((sum / Math.max(1, points.length)) * 100) / 100;
  return { id, kind: KIND.TIME, points, sum, max, avg };
}

/** 把权重表归一化并加点日间抖动 */
function weighted(list, seedKey, totalShare = 1) {
  const rand = mulberry32(strSeed(seedKey));
  const rows = list.map(([key, w]) => ({ key, w: w * (0.88 + rand() * 0.24) }));
  const wsum = rows.reduce((a, r) => a + r.w, 0);
  return rows.map((r) => ({ key: r.key, w: (r.w / wsum) * totalShare }));
}

/** 各维度排行权重（flux/request 共用份额，仅量级不同） */
const COUNTRY_LIST = [
  ['CN', 0.55], ['US', 0.1], ['JP', 0.06], ['KR', 0.05], ['HK', 0.04], ['SG', 0.035],
  ['TW', 0.028], ['DE', 0.022], ['GB', 0.018], ['IN', 0.016], ['FR', 0.012], ['CA', 0.01],
  ['AU', 0.008], ['RU', 0.007], ['BR', 0.006], ['NL', 0.0055], ['ID', 0.005], ['IT', 0.004],
  ['ES', 0.0032], ['AE', 0.0028], ['MY', 0.0026], ['TH', 0.0024], ['PH', 0.0022],
  ['VN', 0.0018], ['SA', 0.0016], ['MX', 0.0015], ['PL', 0.0013], ['CH', 0.0012],
  ['SE', 0.001], ['TR', 0.001], ['AR', 0.0009], ['CL', 0.0008], ['CZ', 0.0008],
  ['IE', 0.0007], ['NO', 0.0006], ['DK', 0.0006], ['FI', 0.0005], ['ZA', 0.0005],
  ['EG', 0.0004], ['NG', 0.0004], ['PK', 0.0003], ['BD', 0.0003], ['IL', 0.0003]
];

const PROVINCE_LIST = [
  ['广东', 0.185], ['江苏', 0.105], ['浙江', 0.095], ['北京', 0.082], ['山东', 0.07],
  ['上海', 0.064], ['河南', 0.052], ['四川', 0.048], ['湖北', 0.041], ['福建', 0.036],
  ['湖南', 0.032], ['河北', 0.03], ['安徽', 0.026], ['辽宁', 0.021], ['陕西', 0.019],
  ['重庆', 0.016], ['天津', 0.013], ['江西', 0.013], ['云南', 0.012], ['广西', 0.011],
  ['山西', 0.01], ['贵州', 0.009], ['吉林', 0.008], ['黑龙江', 0.008], ['内蒙古', 0.007],
  ['新疆', 0.006], ['甘肃', 0.005], ['海南', 0.004], ['宁夏', 0.003], ['青海', 0.002],
  ['西藏', 0.001], ['港澳台', 0.004], ['境外', 0.002]
];

const STATUS_LIST = [
  ['200', 0.87], ['302', 0.04], ['301', 0.02], ['304', 0.028], ['206', 0.012],
  ['403', 0.008], ['404', 0.0065], ['499', 0.0022], ['500', 0.0009], ['502', 0.0006],
  ['503', 0.0004], ['508', 0.0001]
];

const DOMAIN_LIST = [
  ['www.demo.example', 0.44], ['static.demo.example', 0.2], ['api.demo.example', 0.12],
  ['img.demo.example', 0.1], ['cdn.demo.example', 0.08], ['blog.demo.example', 0.06]
];

const URL_LIST = [
  ['/api/v1/data', 0.2], ['/', 0.15], ['/index.html', 0.13], ['/static/js/app.js', 0.12],
  ['/static/css/main.css', 0.09], ['/images/logo.png', 0.08], ['/api/v2/query', 0.07],
  ['/product/overview', 0.06], ['/static/js/chunk-2f3a.js', 0.06], ['/docs/guide', 0.04]
];

const RESOURCE_LIST = [
  ['js', 0.3], ['image', 0.22], ['html', 0.18], ['css', 0.12], ['json', 0.06],
  ['font', 0.06], ['media', 0.04], ['other', 0.02]
];

const SIP_LIST = [
  ['203.0.113.1', 0.16], ['198.51.100.7', 0.13], ['203.0.113.15', 0.11], ['192.0.2.44', 0.09],
  ['198.51.100.23', 0.08], ['203.0.113.99', 0.07], ['192.0.2.120', 0.06], ['198.51.100.201', 0.05],
  ['203.0.113.55', 0.045], ['192.0.2.88', 0.04], ['198.51.100.66', 0.035], ['203.0.113.200', 0.03],
  ['192.0.2.201', 0.025], ['198.51.100.150', 0.02], ['203.0.113.128', 0.015]
];

const REFERER_LIST = [
  ['-', 0.52], ['https://www.demo.example/', 0.16], ['https://blog.demo.example/articles/1', 0.08],
  ['https://news.demo.example/tech', 0.06], ['https://www.demo.example/product', 0.05],
  ['https://bbs.demo.example/topic/42', 0.04], ['https://docs.demo.example/guide', 0.03],
  ['https://community.demo.example/post/7', 0.02]
];

const DEVICE_LIST = [
  ['PC', 0.46], ['Mobile', 0.42], ['Tablet', 0.08], ['Bot', 0.03], ['Other', 0.01]
];

const BROWSER_LIST = [
  ['Chrome', 0.46], ['Edge', 0.13], ['Safari', 0.12], ['Firefox', 0.08], ['微信内置浏览器', 0.07],
  ['360 安全浏览器', 0.04], ['QQ 浏览器', 0.03], ['Opera', 0.02], ['其他', 0.05]
];

const OS_LIST = [
  ['Windows', 0.4], ['Android', 0.24], ['iOS', 0.18], ['macOS', 0.1], ['Linux', 0.05],
  ['鸿蒙OS', 0.02], ['其他', 0.01]
];

const UA_LIST = [
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 0.4],
  ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1', 0.16],
  ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/124 Mobile Safari/537.36', 0.14],
  ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36', 0.1],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0', 0.07],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Edge/124.0', 0.13]
];

/** TOP 维度的可选 key 集（country/province 编码的由 key->中文映射处理） */
const TOP_SETS = {
  country: COUNTRY_LIST,
  province: PROVINCE_LIST,
  statusCode: STATUS_LIST,
  domain: DOMAIN_LIST,
  url: URL_LIST,
  resourceType: RESOURCE_LIST,
  sip: SIP_LIST,
  referers: REFERER_LIST,
  ua_device: DEVICE_LIST,
  ua_browser: BROWSER_LIST,
  ua_os: OS_LIST,
  ua: UA_LIST
};

const TOP_SUFFIX = [
  'country', 'province', 'statusCode', 'domain', 'url', 'resourceType', 'sip',
  'referers', 'ua_device', 'ua_browser', 'ua_os', 'ua'
];

/** 判断 top 指标属于哪个维度 */
function topDim(id) {
  for (const s of TOP_SUFFIX) {
    if (id.endsWith('_' + s)) return s;
  }
  return null;
}

/**
 * 生成单条 TOP 指标（返回前 50 项，按 value 降序）
 */
function genTopMetric(id, { startMs, endMs, zoneIds }) {
  const dim = topDim(id);
  const isFluxDim = id.startsWith('l7Flow_outFlux');
  const factor = factorOf(zoneIds);
  const durationSec = (endMs - startMs) / 1000;
  const dayBucket = Math.floor(startMs / 86400000);
  const seedKey = `${id}|${dayBucket}|${zoneIds?.join(',')}`;

  // 量级：流量维度 -> 该窗口输出流量总量；请求维度 -> 该窗口请求总量
  let total;
  if (isFluxDim) total = 95e6 * durationSec * 0.85 * factor;
  else total = 1500 * durationSec * 0.85 * factor;

  const set = TOP_SETS[dim];
  const seed = strSeed(seedKey);
  const rand = mulberry32(seed);

  let rows = set.map(([key, w]) => {
    const share = w * (0.8 + rand() * 0.4);
    // 保留原始 key（country/province 为编码），统一由前端查表转中文
    return { key, value: Math.round(total * share) };
  });

  const sum = rows.reduce((a, r) => a + r.value, 0);
  // 归一到 total，保证与总量指标量级一致
  if (sum > 0) rows = rows.map((r) => ({ key: r.key, value: Math.round((r.value / sum) * total) }));
  rows = rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value).slice(0, 60);
  return { id, kind: KIND.TOP, data: rows };
}

/** 供 provider 调用：批量生成 */
export function generateMetrics(ids, opts) {
  const results = {};
  for (const id of ids) {
    const meta = METRIC[id];
    if (!meta) continue;
    if (meta.kind === KIND.TOP) results[id] = genTopMetric(id, opts);
    else results[id] = genTimeMetric(id, opts);
  }
  return results;
}

/** 供 provider 调用：单条 */
export function generateMetric(id, opts) {
  const meta = METRIC[id];
  if (!meta) return null;
  if (meta.kind === KIND.TOP) return genTopMetric(id, opts);
  return genTimeMetric(id, opts);
}
