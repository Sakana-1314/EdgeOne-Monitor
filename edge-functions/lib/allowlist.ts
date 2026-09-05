/**
 * edge-functions/lib/allowlist.ts
 * 站点白名单（环境变量配置，空 = 不限）：ALLOWED_ZONE_IDS
 * 仅允许监控的 EdgeOne 站点 ID（ZoneId），逗号分隔。
 */

import type { Env } from './types.ts';

/** 解析逗号/空白/中英文分号分隔的列表 -> 去空、去重、小写 */
export function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  const set = new Set<string>();
  String(raw)
    .split(/[\s,，;；]+/)
    .forEach((s) => {
      const item = s.trim().toLowerCase();
      if (item) set.add(item);
    });
  return [...set];
}

export function allowedZones(env: Env = {}): string[] {
  return parseList(env.ALLOWED_ZONE_IDS);
}
