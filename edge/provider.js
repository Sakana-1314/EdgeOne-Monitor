/**
 * edge/provider.js
 * 数据源 Provider 选择：real(腾讯云 EdgeOne 实时) / mock(演示数据)。
 * 判断优先级：DATA_MODE 显式指定 > auto(有凭据则 real，否则 mock)。
 */

import * as teoProvider from './teo.js';
import * as mockProvider from './mock/index.js';

export function resolveMode(env = {}) {
  const mode = String(env.DATA_MODE || 'auto').toLowerCase();
  const hasCred = Boolean(env.SECRET_ID && env.SECRET_KEY);
  if (mode === 'mock') return 'mock';
  if (mode === 'real') return 'real';
  return hasCred ? 'real' : 'mock';
}

export function isReal(env = {}) {
  return resolveMode(env) === 'real';
}

/** 暴露同一组接口的 Provider（listZones / fetchMetrics / pages...） */
export function getProvider(env = {}) {
  return isReal(env) ? teoProvider : mockProvider;
}
