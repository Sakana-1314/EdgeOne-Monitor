# EdgeOne 监控大屏（EdgeOne Pages 规范版）

> 参考 [afoim/eo_monitor](https://github.com/afoim/eo_monitor) 重构的 EdgeOne 实时监控大屏。
> 前端 Vue3 + VueRouter + Vite + NaiveUI + ECharts；后端按 **腾讯云 EdgeOne Pages Functions（边缘函数）规范** 编写，**仅接入真实腾讯云 EdgeOne 数据**（无演示/模拟模式）。

## 特性

- ✅ **地区分布为第一个 Tab**：全球请求/流量地图、中国省份地图、国家与省份排行，与参考项目一一对应
- ✅ 桌面端**左侧 Tab** + 移动端**响应式**（抽屉导航、单列自适应）
- ✅ **深色 / 浅色**模式（跟随系统 / 手动切换）
- ✅ **登录鉴权**：账号固定 `admin`，密码 `ADMIN_PASSWORD`；签发 **7 天有效期 JWT**（`JWT_SECRET`）
- ✅ 时间范围（近30分钟~近31天 + 自定义）、粒度、站点选择、自动刷新、环比
- ✅ 界面 Tab：地区分布 / 流量与带宽 / 请求与性能 / 回源分析 / 安全防护 / 边缘函数 / Pages 应用 / TOP 排行

## 目录（遵循 EdgeOne Pages 规范）

```
EdgeOne-Monitor/
├── functions/                  # EdgeOne Pages Functions（后端 = 边缘函数）
│   ├── api/
│   │   └── [[default]].js      #   /api/** 统一入口（onRequestGet/Post/Options，Function Handlers）
│   └── lib/                    #   函数内共享模块（随 /functions 一起被平台打包）
│       ├── router.js           #   路由 + 鉴权（JWT）+ 业务
│       ├── jwt.js              #   HS256 签发/校验（WebCrypto）
│       ├── tc3.js              #   腾讯云 API TC3-HMAC-SHA256 签名客户端
│       ├── teo.js              #   EdgeOne 数据接口封装（时序/TOP/安全/函数/Pages）
│       ├── registry.js         #   指标注册表（kind/unit + 接口路由）
│       └── utils.js            #   base64url / sha256 / hmac 等工具
├── src/                        # Vue3 前端源码（Vite）
├── public/                     # 静态资源（ECharts 世界/中国地图 geojson）
├── index.html                  # Vite 入口（模板与官方 vite-vue3 一致）
├── vite.config.js              # 构建到 dist/，/api 本地代理
├── server/index.mjs            # 本地 Pages Function 模拟（node http）
├── scripts/dev.mjs             # pnpm dev（Vite 5173 + API 8787）
└── package.json  pnpm-workspace.yaml  .env.example
```

- **Pages Functions 路由**：`/functions/api/[[default]].js` 匹配 `/api/**`，未匹配则回落到 Pages 静态资源。
- **Handlers 规范**：文件导出 `onRequestGet / onRequestPost / onRequestOptions`，入参为 EventContext（`request / params / env / waitUntil`）。
- **环境变量**：运行时经 `context.env` 读取，即 Pages 项目「环境变量」中的配置。
- **零第三方依赖**：仅用 WebCrypto + fetch，天然可运行于边缘函数（V8）运行时。

## 本地开发

要求 Node ≥ 18，`.env` 配置 `ADMIN_PASSWORD`、`JWT_SECRET` 与 `SECRET_ID`、`SECRET_KEY`：

```bash
cp .env.example .env
pnpm install
pnpm dev        # 开发模式  http://127.0.0.1:5173  （/api 代理到本地函数 8787）

pnpm build && pnpm serve   # 单端口预览 http://127.0.0.1:8088 （dist 静态 + /api 函数）
```

> 说明：数据接口依赖腾讯云凭据，未配置 `SECRET_ID/SECRET_KEY` 时登录可用、数据接口返回 503，前端会给出配置提示。项目**不含任何模拟数据源**。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 登录密码（账号固定 `admin`） |
| `JWT_SECRET` | 是 | JWT 签名密钥（`openssl rand -hex 32`） |
| `TOKEN_TTL_DAYS` | 否 | Token 有效期（天），默认 7 |
| `SECRET_ID` / `SECRET_KEY` | 是 | 腾讯云密钥（`QcloudTEOReadOnlyaccess` 只读权限） |
| `TEO_ENDPOINT` / `TEO_REGION` | 否 | 默认 `teo.tencentcloudapi.com` / `ap-guangzhou` |
| `SITE_NAME` / `SITE_ICON` | 否 | 站点标题 / 图标 |

## 部署到腾讯云 EdgeOne Pages

1. `pnpm build` 产出 `dist/`
2. 将仓库推送到 GitHub，在 EdgeOne Pages 控制台「导入 Git 仓库」创建项目
3. 项目设置：
   - 构建命令：`pnpm build`（或 `npm run build`）
   - 输出目录：`dist`
   - 根目录：仓库根目录 `./`（Pages Functions 固定读取 `/functions`）
4. 在「环境变量」中配置：`ADMIN_PASSWORD`、`JWT_SECRET`、`SECRET_ID`、`SECRET_KEY` 等
5. 提交触发自动构建部署；`/api/**` 由 Pages Function 处理，其余为静态站点

> 本仓库仅把 `.env.example` 提交到远端，真实密钥请在 Pages 控制台环境变量中配置，不进入代码仓库。

## 鉴权与接口

- `POST /api/auth/login { username, password }` → 返回 7 天有效 JWT
- 其余接口需 `Authorization: Bearer <token>`；401 时前端自动登出并跳转登录
- `GET /api/config`、`GET /api/health` 为公开接口，`/api/config` 返回 `configured` 用于前端展示凭据状态
- 数据接口：`/api/zones`、`/api/metrics?names=...&startTime&endTime&interval&zoneId&compare`、`/api/pages/*`
- JWT 验签与密码比较均为常量时间比较，防止时序侧信道

## 参考资料

- [EdgeOne Pages Functions 官方文档](https://edgeone.cloud.tencent.com/pages/document/162936866445025280)
- [EdgeOne Pages 构建指南](https://pages.edgeone.ai/zh/document/build-guide)
- [EdgeOne 官方模板 pages-templates](https://github.com/TencentEdgeOne/pages-templates)
- [EdgeOne Pages Functions 示例 functions-geolocation](https://github.com/TencentEdgeOne/pages-templates/tree/main/examples/functions-geolocation)
