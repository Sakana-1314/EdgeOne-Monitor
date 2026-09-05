/**
 * EdgeOne Pages Functions 适配入口。
 * 兼容两种调用风格：
 *   - Pages Functions: export async function onRequest(context)
 *   - 边缘函数:        export default { async fetch(request, env) }
 */
import { handleFetch } from '../../edge/handler.js';

export async function onRequest(context) {
  const { request, env } = context;
  return handleFetch(request, env);
}

export async function onRequestGet(context) {
  return onRequest(context);
}

export async function onRequestPost(context) {
  return onRequest(context);
}

export default {
  async fetch(request, env) {
    return handleFetch(request, env);
  }
};
