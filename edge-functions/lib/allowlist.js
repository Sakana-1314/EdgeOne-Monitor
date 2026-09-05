/**
 * edge-functions/lib/allowlist.js
 * 站点白名单（环境变量配置，空 = 不限）：ALLOWED_ZONE_IDS
 * 仅允许监控的 EdgeOne 站点 ID（ZoneId），逗号分隔。
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
