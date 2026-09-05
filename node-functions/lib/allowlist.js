/**
 * node-functions/lib/allowlist.js
 * 站点 / 域名 白名单（环境变量配置，空 = 不限）：
 *   - ALLOWED_ZONE_IDS ：仅允许监控的 EdgeOne 站点 ID（ZoneId），逗号分隔
 *   - ALLOWED_DOMAINS  ：仅允许展示的域名（主机名）；子域自动继承父域条目
 */

/** 解析逗号/空白/中英文分号分隔的列表 -> 去空、去重、小写 */
export function parseList(raw) {
  if (!raw) return [];
  const set = new Set();
  String(raw)
    .split(/[\s,，;；]+/)
    .forEach((s) => {
      s = s.trim().toLowerCase();
      if (s) set.add(s);
    });
  return [...set];
}

export function allowedZones(env = {}) {
  return parseList(env.ALLOWED_ZONE_IDS);
}

export function allowedDomains(env = {}) {
  return parseList(env.ALLOWED_DOMAINS);
}

/** host 是否命中白名单（子域继承：host === d 或 host 以 "."+d 结尾） */
export function hostAllowed(host, allowed) {
  if (!allowed || !allowed.length) return true;
  const h = String(host || '').trim().toLowerCase();
  if (!h) return false;
  return allowed.some((d) => h === d || h.endsWith('.' + d));
}

/** 从未授权项里抽取主机名；无主机名（如 '-'）返回 null（表示不适用过滤） */
export function hostOfTopKey(key, dim) {
  if (dim === 'referers') {
    const s = String(key || '').trim();
    if (s === '-' || !s) return null; // 直接访问，保留
    try {
      const u = s.startsWith('//') ? new URL('https:' + s) : new URL(s);
      return u.hostname;
    } catch {
      // 非标准 URL：整体当作主机名尝试
      return s.split(/[/?#]/)[0].toLowerCase();
    }
  }
  // domain 维度：key 即主机名
  return String(key || '').trim().toLowerCase() || null;
}

/**
 * 过滤“带主机名维度”的 TOP 数据（domain / referers）。
 * 未授权项合并为一条聚合记录；无过滤配置时原样返回。
 * @param {Array<{key:string,value:number}>} rows
 * @param {string} dim 'domain' | 'referers'
 * @param {string[]} allowed 白名单（空 = 不过滤）
 */
export function filterHostRows(rows, dim, allowed) {
  const list = Array.isArray(rows) ? rows : [];
  if (!allowed || !allowed.length) return list;

  const kept = [];
  let hidden = 0;
  for (const r of list) {
    const host = hostOfTopKey(r.key, dim);
    if (host === null || hostAllowed(host, allowed)) kept.push(r);
    else hidden += r.value || 0;
  }
  if (!hidden) return kept;
  const out = [...kept];
  // 追加聚合条（放最后，避免与真实域名混淆）
  out.push({ key: '（未授权域名 · 已隐藏）', value: hidden, _hiddenAgg: true });
  return out;
}
