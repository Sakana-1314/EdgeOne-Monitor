/**
 * EdgeOne Pages Functions —— API 统一入口
 *
 * 路由：/edge-functions/api/[[default]].ts
 * 匹配：/api/** （含 /api，不含其他前缀，未匹配则回落到 Pages 静态资源）
 *
 * 遵循 EdgeOne Pages Functions 规范（Function Handlers）：
 *   - onRequestGet     匹配 GET
 *   - onRequestPost    匹配 POST
 *   - onRequestOptions 匹配 OPTIONS（CORS 预检）
 * context: EventContext（request / params / env / waitUntil）
 */

import { apiHandler } from '../lib/router.ts';
import type { Env } from '../lib/types.ts';

/** Edge Functions 运行时的调用上下文（仅使用到 request / env） */
interface PagesFunctionContext {
  request: Request;
  env: Env;
}

export async function onRequestGet(context: PagesFunctionContext): Promise<Response> {
  return apiHandler(context.request, context.env);
}

export async function onRequestPost(context: PagesFunctionContext): Promise<Response> {
  return apiHandler(context.request, context.env);
}

export async function onRequestOptions(context: PagesFunctionContext): Promise<Response> {
  return apiHandler(context.request, context.env);
}
