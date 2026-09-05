# EdgeOne 监控大屏

基于腾讯云 EdgeOne 的实时监控大屏。前端 Vue3 + Vite + NaiveUI + ECharts，后端按 **EdgeOne Pages Functions（边缘函数）规范**编写，直连 EdgeOne 开放接口（TC3 签名），仅展示真实数据。

## 功能

- 8 个监控 Tab：地区分布（全球/中国地图与排行）、流量与带宽、请求与性能、回源分析、安全防护、边缘函数、Pages 应用、TOP 排行
- 登录鉴权：账号 `admin`，密码来自 `ADMIN_PASSWORD`；登录签发 7 天 JWT（`JWT_SECRET`）
- 桌面端左侧 Tab、移动端响应式；深色 / 浅色模式
- 时间范围（含自定义）、数据粒度、站点选择、自动刷新、环比

## 配置

**环境变量（Pages 控制台「项目设置 - 环境变量」或本地 `.env`）**

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 登录密码（账号固定 `admin`） |
| `JWT_SECRET` | 是 | JWT 签名密钥（`openssl rand -hex 32`） |
| `TOKEN_TTL_DAYS` | 否 | Token 有效期天数，默认 7 |
| `SECRET_ID` / `SECRET_KEY` | 是 | 腾讯云密钥（`QcloudTEOReadOnlyaccess` 只读权限）；缺失时数据接口返回 503 |
| `TEO_ENDPOINT` / `TEO_REGION` | 否 | 默认 `teo.tencentcloudapi.com` / `ap-guangzhou` |
| `SITE_NAME` / `SITE_ICON` | 否 | 站点标题 / 图标 |

**本地开发 / 预览**

```bash
cp .env.example .env     # 填入 ADMIN_PASSWORD、JWT_SECRET、SECRET_ID、SECRET_KEY
pnpm install
pnpm dev                 # http://127.0.0.1:5173（/api 走本地 Pages Function 模拟）
pnpm build && pnpm serve # 单端口预览 http://127.0.0.1:8088
```

**部署（EdgeOne Pages）**

1. `pnpm build` 构建到 `dist/`
2. 仓库推送到 GitHub 后，在 EdgeOne Pages「导入 Git 仓库」创建项目
3. 项目设置：构建命令 `pnpm build`，输出目录 `dist`
4. 配置上表环境变量后提交，触发自动构建；`/api/**` 由 `functions/` 处理，其余为静态站点

## 目录

```
functions/api/[[default]].js    Pages Functions 入口（onRequestGet/Post/Options）
functions/lib/                  路由 / JWT / TC3 签名 / EdgeOne 接口封装
src/                            前端源码
public/                         静态资源（logo、ECharts 地图 geojson）
server/ scripts/                本地运行
```
