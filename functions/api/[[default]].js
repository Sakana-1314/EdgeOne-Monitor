/**
 * EdgeOne Pages Functions —— API 统一入口
 *
 * 路由：/functions/api/[[default]].js
 * 匹配：/api/** （含 /api，不含其他前缀，未匹配则回落到 Pages 静态资源）
 *
 * 遵循 EdgeOne Pages Functions 规范（Function Handlers）：
 *   - onRequestGet     匹配 GET
 *   - onRequestPost    匹配 POST
 *   - onRequestOptions 匹配 OPTIONS（CORS 预检）
 * context: EventContext（request / params / env / waitUntil）
 */

import { apiHandler } from '../lib/router.js';

export async function onRequestGet(context) {
  return apiHandler(context.request, context.env);
}

export async function onRequestPost(context) {
  return apiHandler(context.request, context.env);
}

export async function onRequestOptions(context) {
  return apiHandler(context.request, context.env);
}
