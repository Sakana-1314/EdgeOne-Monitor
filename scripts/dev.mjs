/**
 * scripts/dev.mjs —— 开发模式：Vite(5173) + 本地 API 服务(8787)
 * Vite 已配置 /api -> http://127.0.0.1:8787 代理。
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_PORT = 8787;
const WEB_PORT = 5173;

// 加载 .env
try {
  process.loadEnvFile(path.join(ROOT, '.env'));
} catch {
  /* ignore */
}

const child = spawn(process.execPath, ['server/index.mjs', '--port', String(API_PORT)], {
  cwd: ROOT,
  env: { ...process.env, PORT: String(API_PORT) },
  stdio: 'inherit'
});

let viteServer;
async function startVite() {
  const { createServer } = await import('vite');
  viteServer = await createServer({
    configFile: path.join(ROOT, 'vite.config.js'),
    server: { host: '0.0.0.0', port: WEB_PORT }
  });
  await viteServer.listen();
  viteServer.printUrls();
}

function shutdown(code = 0) {
  console.log('\n[dev] 正在关闭…');
  if (viteServer) viteServer.close().catch(() => {});
  child.kill('SIGTERM');
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
child.on('exit', (c) => {
  if (!viteServer) process.exit(c ?? 0);
});

startVite()
  .then(() => {
    console.log(`\n[EdgeOne 监控大屏] 开发环境就绪`);
    console.log(`   Web : http://127.0.0.1:${WEB_PORT}`);
    console.log(`   API : http://127.0.0.1:${API_PORT}`);
  })
  .catch((e) => {
    console.error('[dev] Vite 启动失败', e);
    child.kill('SIGTERM');
    process.exit(1);
  });
