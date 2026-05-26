# 🏨 易宿酒店预订 — Taro 多端用户版

> 一套核心业务逻辑，复用到 **H5** · **微信小程序** · **React Native APP**  
> Taro 4 + React 18 + TypeScript · Zustand + TanStack Query · NutUI React

---

## ✨ 核心亮点

- **用户侧预订闭环**：打通「搜索 → 列表 → 详情 → 下单 → 模拟支付回调 → 查看 / 删除订单」，和后台订单状态机、库存一致性模型对齐，而不是只停留在页面展示。
- **实时链路有明确取舍**：H5 端通过 `EventSource` 订阅 `price-updates`，断线后指数退避 + 抖动重连并在恢复后走 REST 对齐；小程序 / RN 因运行时差异采用轮询兜底。
- **实时更新不是全量重刷**：收到 SSE 事件后优先按 `hotelId` 增量更新 `TanStack Query Cache`，仅在酒店上下线等场景触发全量 refetch，兼顾实时性与请求成本。
- **跨端稳定性是显式设计出来的**：用 `useIsWeapp` 做运行时分支，小程序关键页面走显式首屏 / 分页拉取与静默轮询；在 weapp / RN 通过 `onlineManager` 修正 Query 在线感知，避免请求进入 paused。
- **状态分层清晰**：`Zustand + persist` 管理搜索条件、收藏和最近浏览等客户端状态，`TanStack Query` 管理列表 / 详情等服务端状态，减少跨端分支蔓延到页面层。
- **列表性能与质量有证据**：列表页同时支持虚拟滚动和无限加载，当前本地可复跑 `87` 条 Vitest；仓库内接入 GitHub Actions CI 和 Web Vitals 采集上报。

## 🔍 补充能力

- GPS 城市定位、搜索历史与热门标签、多维筛选、价格趋势图、收藏夹持久化。
- H5 已配置 `vercel.json`，可直接部署演示版本。

---

## 📐 架构与设计

- **跨端一致性与数据流**：[`ARCHITECTURE.md`](./ARCHITECTURE.md)
- **实时价格方案（SSE + 轮询）**：[`REALTIME_PRICE.md`](./REALTIME_PRICE.md)

### 关键设计概览

- **核心逻辑复用**：通过 Taro + 自定义 hooks 将 H5 / 小程序 / RN 的差异收敛在 `useIsWeapp`、weapp 首屏 / 分页兜底拉取与运行时适配层中。
- **预订闭环前端链路**：打通「搜索 → 列表 → 详情 → 下单 → 模拟支付回调 → 查看/删除订单」全流程，与后台订单/库存模型对齐。
- **列表性能**：列表页在数据量达到阈值后启用虚拟滚动，并配合无限加载、骨架屏和增量缓存更新减少渲染与请求压力。
- **实时价格**：H5 端使用 SSE（EventSource）指数退避重连，小程序/RN 用轮询兜底，保证多端价格感知的一致性。
- **运行时校验取舍**：生产环境保留最小校验，开发环境启用详细结构校验，兼顾包体与排障效率。

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | **Taro 4.0.9** + **React 18** + **TypeScript 5** |
| 多端 | H5 / 微信小程序 / React Native（分离模式） |
| UI | **NutUI React Taro** + 自定义组件体系 |
| 状态管理 | **Zustand 5**（客户端，persist 中间件）+ **TanStack Query 5**（服务端） |
| 数据校验 | **Zod 4** |
| 日期处理 | **Day.js** |
| 性能监控 | **web-vitals**（FCP / LCP / CLS / INP / TTFB） |
| 测试 | **Vitest 2** + **Testing Library** + **jsdom**，87 条单测 |
| 构建 | Webpack 5（Taro runner）/ Babel / SWC |
| 部署 | Vercel（H5）/ 微信开发者工具（小程序） |

---

## ✅ 质量与验证

| 维度 | 当前口径 |
|------|----------|
| 自动化测试 | `87` 条 Vitest 单测 |
| CI | `.github/workflows/ci.yml` 自动执行 Typecheck + Test + Coverage + Build H5 |
| 运行时验证 | H5 端 Web Vitals 批量上报到后端 `/api/v1/metrics/web-vitals` |
| 构建验证 | `npm run typecheck` + `npm run build:h5` 可本地复跑 |

---

## 📁 目录结构

```
hotel-mobile-taro/
├── config/               # 构建配置（dev / prod）
├── src/
│   ├── app.tsx           # 应用入口（TanStack QueryClient 初始化）
│   ├── app.config.ts     # 路由与全局配置
│   ├── components/       # 12 个自定义组件
│   │   ├── Button/       # 通用按钮（加载态 + 触摸反馈）
│   │   ├── Calendar/     # 日期选择器
│   │   ├── CityPicker/   # 城市选择弹窗
│   │   ├── RoomPicker/   # 房型选择器
│   │   ├── HotelCard/    # 酒店卡片（图片 + 评分 + 价格）
│   │   ├── PriceTrend/   # 价格趋势折线图（纯 View 绘制）
│   │   ├── Popup/        # 弹出层
│   │   ├── Skeleton/     # 骨架屏
│   │   ├── Loading/      # 加载指示器
│   │   ├── ErrorBoundary/ # 全局错误兜底
│   │   ├── SafeArea/     # 安全区域适配
│   │   └── ui/           # 基础 UI 元素
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useHotels.ts          # 酒店列表 / 详情 / 无限滚动
│   │   ├── usePriceUpdates.ts    # SSE 实时价格订阅
│   │   ├── useLocation.ts        # GPS 定位 + 逆地理编码
│   │   ├── useSearch.ts          # 搜索参数管理
│   │   ├── useOrders.ts          # 订单查询 / 取消 / 删除 / 模拟支付
│   │   ├── useWeappFetch.ts      # 小程序请求兜底实验 Hook（当前主链路未直接依赖）
│   │   └── useIsWeapp.ts         # 平台检测
│   ├── store/            # Zustand 状态管理
│   │   ├── useHotelStore.ts      # 收藏 / 最近浏览（persist）
│   │   ├── useSearchStore.ts     # 搜索历史 / 筛选条件（persist）
│   │   └── storage.ts            # Taro Storage 适配器
│   ├── pages/            # 页面
│   │   ├── index/                # 酒店查询首页
│   │   ├── hotel-list/           # 酒店列表（无限滚动 + 筛选）
│   │   ├── hotel-detail/         # 酒店详情（轮播 + 房型 + 价格趋势）
│   │   ├── favorites/            # 收藏夹
│   │   ├── orders/               # 我的订单（下单 / 模拟支付回调 / 删除订单）
│   │   └── login/                # customer 登录页
│   ├── services/         # API 封装（Axios / Taro.request 双通道）
│   ├── constants/        # 常量（50 城市列表等）
│   ├── styles/           # 全局样式变量 + RN 适配工具
│   ├── types/            # TypeScript 类型定义
│   └── utils/            # 工具函数（图片哈希 / 格式化 / Web Vitals 上报）
├── vitest.config.mts     # Vitest 测试配置
├── vercel.json           # Vercel 部署配置
├── project.config.json   # 微信小程序项目配置
└── package.json
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** ≥ 18　·　**npm** ≥ 9
- 后端：需先启动 [`../hotel-management/README.md`](../hotel-management/README.md) 中的后端服务

### 1. 安装依赖

```bash
npm install
# RN 端若遇依赖冲突：npm install --legacy-peer-deps
```

### 2. 启动后端

```bash
cd ../hotel-management/backend
npm install
# 创建 .env.local，最小配置只需提供 JWT_SECRET
npm run seed
npm run start:dev          # http://localhost:3000
```

### 3. 运行 H5

```bash
npm run dev:h5             # http://localhost:10086
```

H5 开发时 `/api` 自动代理到 `http://localhost:3000`（后端 API 前缀为 `/api/v1`）。

### 4. 运行微信小程序

```bash
npm run dev:weapp
```

用微信开发者工具打开 `dist` 目录。真机调试需设置局域网 IP：

```bash
TARO_APP_API_BASE=http://192.168.1.100:3000 npm run dev:weapp
```

### 5. 运行 React Native

```bash
npm run dev:rn             # 启动 Metro (端口 8081)
```

推荐使用 [Taro Playground](https://github.com/wuba/taro-playground) 扫码加载；也可对接 [Taro Native Shell](https://github.com/NervJS/taro-native-shell)（分支 0.70.0）。

### 6. 订单闭环演示账号

| 角色 | 用户名 | 密码 | 用途 |
|------|--------|------|------|
| 用户 | `customer01` | `Cust123456` | 登录移动端，演示下单 / 模拟支付回调 / 查看订单 |

---

## 📄 页面与功能

| 页面 | 路径 | 核心功能 |
|------|------|----------|
| 🔍 酒店查询页 | `/pages/index/index` | Banner · 城市选择 · 日历 · 星级/价格筛选 · 快捷标签 · 搜索历史 |
| 📋 酒店列表页 | `/pages/hotel-list/index` | 虚拟滚动 · 无限加载 · 多维筛选 · GPS 定位 · 骨架屏 |
| 🏨 酒店详情页 | `/pages/hotel-detail/index` | 图片轮播 · 放大预览 · 房型价格排序 · 价格趋势图 · 收藏 |
| ❤️ 收藏夹 | `/pages/favorites/index` | 离线持久化 · 收藏列表 |
| 🔐 登录页 | `/pages/login/index` | customer 登录 · 订单闭环演示入口 |
| 🧾 我的订单 | `/pages/orders/index` | 查看订单 · 取消订单 · 模拟支付回调 · 删除订单 |

---

## 🧪 测试

```bash
npm test                   # Vitest 单元测试（87 tests / 10 files）
npm run test:coverage      # 覆盖率报告
npm run typecheck          # TypeScript 类型检查
```

---

## 📦 构建与部署

```bash
npm run build:h5           # H5 生产包
npm run build:weapp        # 微信小程序生产包
npm run build:rn -- --platform ios      # RN iOS bundle
npm run build:rn -- --platform android  # RN Android bundle
```

H5 版已配置 `vercel.json`，推送后自动部署。

### 性能记录

- H5 包体优化记录见 [`PERF_BENCHMARK.md`](./PERF_BENCHMARK.md)

---

## 🌐 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `TARO_APP_API_BASE` | 后端地址 | H5 代理 / 局域网 IP |
| `TARO_APP_API_PORT` | 开发端口 | `3000` |

---

## 📊 数据支持

- **10 000 家酒店** · **50 个城市** · **5 个星级** · **150+ 张高质量图片**
- 5 个筛选标签：亲子 / 豪华 / 免费停车场 / 含早餐 / 健身房（各 ~20%）

---

## 🔗 相关项目

| 项目 | 说明 | 仓库 |
|------|------|------|
| **hotel-management** | 管理系统（NestJS 后端 + React PC 前端） | [GitHub](https://github.com/lwayne7/hotel-management) |
| **hotel-mobile** | 用户端 — 纯 H5 轻量版（Vite + Ant Design） | [GitHub](https://github.com/lwayne7/hotel-mobile) |

---

## 📄 许可证

本项目仅供学习使用。

⭐ 如果这个项目对你有帮助，请给一个 Star！
