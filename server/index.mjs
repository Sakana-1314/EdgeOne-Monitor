/**
 * server/index.mjs —— 本地运行 / 预览 服务
 *
 * 复用 edge/handler.js 的同一份后端逻辑，Node 原生 http 实现：
 *   - /api/*           交给边缘函数 handleFetch
 *   - 其余路径         若存在 dist/ 则作为静态站点返回（用于生产预览）
 *
 * 用法：
 *   node server/index.mjs --serve --port 8088   # 同时托管构建产物 dist
 *   node server/index.mjs --port 8787           # 仅 API（配合 vite dev 代理）
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleFetch } from '../edge/handler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ---- 加载 .env（Node >= 20.12）----
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  /* 无 .env 时静默 */
}

const args = process.argv.slice(2);
const serveStatic = args.includes('--serve');
const portArg = (() => {
  const i = args.indexOf('--port');
  return i >= 0 ? Number(args[i + 1]) : NaN;
})();
const PORT = Number.isInteger(portArg) ? portArg : Number(process.env.PORT) || 8787;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json'
};

/** 将 Node 请求转为 Web Request */
function toWebRequest(req, body) {
  const host = req.headers.host || `127.0.0.1:${PORT}`;
  const url = new URL(req.url, `http://${host}`);
  const headers = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (['host', 'content-length', 'connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'expect'].includes(k)) continue;
    if (v !== undefined) headers[k] = String(v);
  }
  return new Request(url, {
    method: req.method,
    headers,
    body: body && body.length ? body : undefined
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function sendStatic(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback 到 index.html（本项目使用 hash 路由，通常不需要）
    if (filePath.endsWith('index.html') || !filePath.includes('.')) {
      const idx = path.join(DIST, 'index.html');
      if (fs.existsSync(idx)) {
        res.writeHead(200, { 'content-type': MIME['.html'] });
        return res.end(fs.readFileSync(idx));
      }
    }
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('404 Not Found');
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
}

const server = http.createServer(async (req, res) => {
  const urlPath = new URL(req.url, 'http://x').pathname;

  try {
    if (urlPath.startsWith('/api')) {
      const body = await readBody(req);
      const webReq = toWebRequest(req, body);
      const webRes = await handleFetch(webReq, { ...process.env });
      res.writeHead(webRes.status, Object.fromEntries(webRes.headers));
      const buf = Buffer.from(await webRes.arrayBuffer());
      return res.end(buf);
    }
    // 静态资源
    if (serveStatic) {
      let rel = decodeURIComponent(urlPath);
      if (rel === '/' || rel === '') rel = '/index.html';
      const file = path.normalize(path.join(DIST, rel));
      if (!file.startsWith(DIST)) {
        res.writeHead(403);
        return res.end('403');
      }
      return sendStatic(req, res, file);
    }
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`EdgeOne 监控大屏 API 服务运行中（${urlPath}）。使用 pnpm dev 启动开发模式，或 pnpm build && pnpm serve 启动完整预览。`);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Server Error: ' + (e && e.message));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const mode = resolveMode();
  console.log(`[EdgeOne 监控大屏] ${serveStatic ? '预览(静态+API)' : 'API'} 服务: http://127.0.0.1:${PORT}  数据源: ${mode}`);
});

function resolveMode() {
  const hasCred = process.env.SECRET_ID && process.env.SECRET_KEY;
  const m = (process.env.DATA_MODE || 'auto').toLowerCase();
  if (m === 'real') return 'real(腾讯云 EdgeOne)';
  if (m === 'mock') return 'mock(演示数据)';
  return hasCred ? 'real(腾讯云 EdgeOne)' : 'mock(演示数据，未配置 SECRET_ID/SECRET_KEY)';
}
