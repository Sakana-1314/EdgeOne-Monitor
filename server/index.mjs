/**
 * server/index.mjs —— 本地运行 / 预览 服务（模拟 EdgeOne `pages dev`）
 *
 * 与线上一致地调用 node-functions/ 下的官方 Node Functions 入口：
 *   - /api/*           由 node-functions/api/[[default]].js 的 onRequestGet/Post/Options 处理
 *   - 其余路径         若存在 dist/ 则作为静态站点返回（用于生产预览）
 *
 * 用法：
 *   node server/index.mjs --serve --port 8088   # 同时托管构建产物 dist
 *   node server/index.mjs --port 8787           # 仅 API（配合 pnpm dev 的 Vite 代理）
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequestGet, onRequestPost, onRequestOptions } from '../node-functions/api/[[default]].js';

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

/** 按 HTTP 方法调用 functions 入口（与线上 Pages Functions 一致） */
async function invokePagesFunction(webReq) {
  const env = { ...process.env };
  const context = { request: webReq, env, params: {}, waitUntil: () => {} };
  switch (webReq.method) {
    case 'GET':
      return onRequestGet(context);
    case 'POST':
      return onRequestPost(context);
    case 'OPTIONS':
      return onRequestOptions(context);
    default:
      return new Response('Method Not Allowed', { status: 405 });
  }
}

function sendStatic(req, res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (filePath.endsWith('index.html') || !path.extname(filePath)) {
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
      const webRes = await invokePagesFunction(toWebRequest(req, body));
      res.writeHead(webRes.status, Object.fromEntries(webRes.headers));
      return res.end(Buffer.from(await webRes.arrayBuffer()));
    }
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
    res.end(
      'EdgeOne 监控大屏 Pages Functions 本地服务运行中。使用 pnpm dev 启动开发模式，或 pnpm build && pnpm serve 启动完整预览。'
    );
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Server Error: ' + (e && e.message));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const configured = process.env.SECRET_ID && process.env.SECRET_KEY ? '是' : '否（仅配置了鉴权，数据需 SECRET_ID/SECRET_KEY）';
  console.log(`[EdgeOne 监控大屏] ${serveStatic ? '预览(静态+API)' : 'API'} 服务: http://127.0.0.1:${PORT}  已配置腾讯云凭据: ${configured}`);
});
