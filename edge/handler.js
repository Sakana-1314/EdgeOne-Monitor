/**
 * edge/handler.js
 * 边缘函数入口（Worker 风格默认导出）。
 * - EdgeOne 边缘函数/Pages Function 直接部署本文件所在目录即可
 * - 本地 Node 环境通过 server/index.mjs 复用同一逻辑
 */

import { handleFetch } from './api.js';

export const worker = { fetch: handleFetch };
export default worker;
export { handleFetch };
