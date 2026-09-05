# EdgeOne 监控大屏（v2）

> 在参考 [afoim/eo_monitor](https://github.com/afoim/eo_monitor) 的基础上重构的**更高阶** EdgeOne 实时监控大屏。
> 前端 Vue3 + VueRouter + Vite + NaiveUI + ECharts；后端全部运行于 **边缘函数 / Pages Function**（零第三方依赖）。

- ✅ **地区分布为第一个 Tab**：全球请求/流量地图、中国省份地图、国家与省份排行，与参考项目一一对应
- ✅ 桌面端**左侧 Tab** 布局 + 移动端**响应式**（抽屉导航、单列自适应）
- ✅ **深色 / 浅色** 模式（跟随系统 / 手动切换）
- ✅ **登录鉴权**：账号固定 `admin`，密码由 `ADMIN_PASSWORD` 指定；登录后签发 **有效期 7 天** 的 **JWT**（`JWT_SECRET` 配置）
- ✅ 时间范围（近30分钟~近31天 + **自定义**）、数据粒度（自动/1分钟/5分钟/1小时/1天）、站点选择、自动刷新
- ✅ 无腾讯云凭据时自动进入**演示数据模式**，界面全功能可预览

## 界面总览

| Tab | 内容 |
| --- | --- |
| 地区分布 | 全球请求/流量地图、中国省份地图、国家/省份流量与请求排行 |
| 流量与带宽 | 总/入/出 流量与带宽趋势、KPI + 环比 |
| 请求与性能 | 请求数、平均响应耗时、平均首字节耗时 |
| 回源分析 | 回源流量/带宽/请求数趋势、缓存命中率 |
| 安全防护 | DDoS/CC：精确/托管/速率限制拦截（自动按 14 天截取） |
| 边缘函数 | Edge Functions 请求数与 CPU 耗时 |
| Pages 应用 | 构建次数、Cloud Functions 请求数/GBs、月度进度 |
| TOP 排行 | 状态码/域名/URL/资源类型/客户端IP/Referer/设备/浏览器/OS/UA（流量·请求双维度） |

## 技术栈

- **前端**：Vue 3 `<script setup>` + Vue Router（hash 路由，便于静态部署）+ Pinia + Naive UI + ECharts 5
- **后端（边缘函数）**：`export default { fetch(request, env) }` Worker 风格，纯 WebCrypto + fetch，**无 npm 依赖**，
  可在 EdgeOne 边缘函数 / Pages Function / 任意 Node 环境运行同一份代码
- **真实数据源**：`edge/tc3.js` 手写腾讯云 TC3-HMAC-SHA256 签名，直连 `teo.tencentcloudapi.com`
- **部署形态**：EdgeOne Pages（静态站点 + `functions/api/[[path]].js`）

## 快速开始（本地）

要求 Node ≥ 18。

```bash
pnpm install
cp .env.example .env       # 默认 ADMIN_PASSWORD=admin，DATA_MODE=auto（无凭据自动演示数据）
pnpm dev                   # 开发模式: http://127.0.0.1:5173 （/api 代理到本地 API 8787）

# 或者：构建 + 单端口预览
pnpm build
pnpm preview               # http://127.0.0.1:8088  (dist 静态 + /api 边缘函数同一进程)
```

浏览器打开后：账号 `admin`，密码见 `.env` 的 `ADMIN_PASSWORD`（演示默认 `admin`）。

> 若使用 pnpm ≥ 10 且命中"忽略构建脚本"提示，已在 `pnpm-workspace.yaml` 配置
> `verifyDepsBeforeRun: false` 与 `onlyBuiltDependencies`，`pnpm run *` 可直接使用。

## 配置（环境变量）

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 登录密码（账号固定 `admin`） |
| `JWT_SECRET` | 是 | JWT 签名密钥，建议 `openssl rand -hex 32` |
| `TOKEN_TTL_DAYS` | 否 | Token 有效期（天），默认 `7` |
| `SITE_NAME` / `SITE_ICON` | 否 | 站点标题 / 图标 |
| `SECRET_ID` / `SECRET_KEY` | 否 | 腾讯云密钥（仅需 `QcloudTEOReadOnlyaccess`）；缺省时进入演示模式 |
| `TEO_ENDPOINT` / `TEO_REGION` | 否 | 默认 `teo.tencentcloudapi.com` / `ap-guangzhou` |
| `DATA_MODE` | 否 | `auto`（默认）/ `real` / `mock` |
| `PORT` | 否 | 本地服务端口（默认 8088） |

## 部署到 EdgeOne Pages

1. `pnpm build` 生成 `dist/`
2. 把仓库推送到 GitHub，在 EdgeOne Pages 创建项目并连接
   - 静态根目录填 `dist`
   - Pages 函数目录 `functions`（`functions/api/[[path]].js` 会接管 `/api/*`）
3. 在环境变量里配置 `ADMIN_PASSWORD`、`JWT_SECRET`、`SECRET_ID`、`SECRET_KEY` 等
4. 也可把 `functions/` 中的处理逻辑按"边缘函数"独立发布（`edge/handler.js` 默认导出 `fetch`）

## 目录结构

```
edge/                 # 后端(边缘函数)：鉴权/JWT、TC3 签名、EdgeOne 封装、演示数据生成
  api.js              #   路由 + 鉴权中间件
  jwt.js              #   HS256 JWT 签发/校验(WebCrypto)
  tc3.js              #   腾讯云 TC3 签名客户端
  teo.js              #   真实数据 Provider(归一化)
  mock/               #   演示数据 Provider
  provider.js         #   数据源切换 auto/real/mock
functions/api/[[path]].js  # EdgeOne Pages Function 适配入口
server/index.mjs      # 本地单端口服务（静态 + /api）
scripts/dev.mjs       # 开发模式编排（Vite 5173 + API 8787）
public/geo/           # ECharts 世界/中国地图 geojson
src/                  # Vue3 前端
  layouts/            #   桌面左侧 Tab / 移动抽屉布局、全局工具条
  views/              #   Login + 8 个功能 Tab
  components/         #   EChart/PanelCard/KpiCard/TopRankList/GeoMap/Segmented
  composables/        #   useMetrics / useLoader（跟随全局查询自动刷新）
  store/              #   app(主题/登录) + dashboard(时间/粒度/站点/自动刷新)
  api/ utils/ config/ styles/
```

## 鉴权说明

- 登录 `POST /api/auth/login {username,password}` → 签发 `HS256` JWT，有效期 7 天
- 除 `/api/config`、`/api/health`、`/api/auth/login` 外的接口都需要 `Authorization: Bearer <token>`
- 前端把 token 存于 `localStorage`；任一接口返回 401 会自动清凭证并跳回登录页
- 密码比较与 JWT 验签均采用常量时间比较，防止时序侧信道

## 安全 / 说明

- 演示数据为**确定性随机**生成（随时间平滑、按站点缩放、24h 日内波动），用于无凭据时的效果预览
- 真实数据接口返回已归一化结构（`time`/`top` 两类），前端对 mock 与 real 无差别使用
- 安全类指标仅支持 14 天内数据，前端自动截取并提示
