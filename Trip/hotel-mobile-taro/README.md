# 易宿酒店预订 - Taro 多端

基于 Taro 3 + React + TypeScript 的用户端酒店预定流程，一套代码编译到 **H5**、**微信小程序** 与 **React Native APP**。

## 技术栈

- **框架**: Taro 3、React 18、TypeScript
- **多端**: H5、微信小程序、React Native APP（分离模式，可选 Taro Playground 或 Taro Native Shell）
- **后端**: 与 `hotel-management/backend` 共用 API（Node.js）

## 目录结构

```
hotel-mobile-taro/
├── config/           # 构建配置（dev/prod）
├── src/
│   ├── app.tsx       # 应用入口
│   ├── app.config.ts # 路由与全局配置
│   ├── app.scss      # 全局样式
│   ├── components/   # 公共组件（如 Calendar）
│   ├── pages/        # 页面：index(查询)、hotel-list、hotel-detail
│   ├── services/     # 请求封装、API
│   └── types/        # 类型定义
├── types/            # 全局类型声明
├── project.config.json  # 微信小程序项目配置
└── package.json
```

## 开发

### 1. 安装依赖

```bash
cd hotel-mobile-taro
npm install
```

### 2. 启动后端

确保酒店管理后端已启动（与 hotel-mobile 共用）：

```bash
cd hotel-management/backend
npm run start:dev
```

### 3. 运行 H5

```bash
npm run dev:h5
```

浏览器访问 http://localhost:10086。H5 开发时 `/api` 会代理到 `http://localhost:3000`。

### 4. 运行微信小程序

```bash
npm run dev:weapp
```

用微信开发者工具打开项目根目录下的 `dist` 目录（编译产物）。

**小程序请求域名**：在微信公众平台将后端接口域名加入 request 合法域名（如 `https://your-api.com`）；本地调试时在微信开发者工具中勾选「不校验合法域名、web-view...」即可请求本地或任意后端。

### 5. 运行 APP（React Native）

采用 **分离模式**：JS 在本仓，iOS/Android 通过 Taro Playground 或 [Taro Native Shell](https://github.com/NervJS/taro-native-shell)（分支 0.70.0，对应 RN 0.70.x）运行。

**方式一：Taro Playground（推荐先做）**

1. 安装 [Taro Playground](https://github.com/wuba/taro-playground) 到手机。
2. 在项目根目录执行：
   ```bash
   npm run dev:rn
   ```
   启动 Metro（默认端口 8081）。
3. 可选带二维码：`npm run dev:rn -- --qr`，用 Playground 扫码或输入 `电脑IP:8081` 加载 dev bundle。

**方式二：对接 Taro Native Shell**

1. Fork [taro-native-shell](https://github.com/NervJS/taro-native-shell)，切换到 **0.70.0** 分支。
2. 将壳工程放在与 hotel-mobile-taro 同级目录，在 `config/index.js` 的 `rn.output` 中配置输出路径指向壳工程的 ios/android 目录。
3. 执行 `npm run build:rn -- --platform ios` 或 `--platform android` 生成 bundle，再在壳工程中执行 `yarn ios` / `yarn android` 或使用 Xcode/Android Studio 运行。

**RN 端请求**：RN 无法使用相对路径 `/api`，必须使用完整 baseURL。开发时默认使用 `http://localhost:3000`（真机调试时请改为电脑局域网 IP，如 `http://192.168.1.100:3000`）。生产可在构建时通过 `TARO_APP_API_BASE` 或 `config/prod.js` 的 `defineConstants` 配置。

**首次运行 RN**：若 `npm run dev:rn` 报错缺少 react-native 等依赖，可执行 `yarn upgradePeerdeps` 或按 [Taro RN 文档](https://docs.taro.zone/docs/3.x/react-native) 安装 `@tarojs/taro-rn`、`@tarojs/components-rn`、`@tarojs/router-rn` 的 peer 依赖。

## 环境变量（可选）

- **H5**：开发时默认通过 devServer 代理访问 `/api`，无需配置。生产部署时可设置 `TARO_APP_API_BASE` 为后端地址（如 `https://your-api.com`）。
- **微信小程序**：在微信公众平台配置 request 合法域名，或本地调试时关闭域名校验。若需区分环境，可在 `config/dev.js` 或 `config/prod.js` 的 `defineConstants` 中设置 `TARO_APP_API_BASE`。
- **APP（RN）**：开发时 `config/dev.js` 已设置 `TARO_APP_API_BASE: "http://localhost:3000"`；真机调试请改为电脑局域网 IP。生产构建时通过 `defineConstants` 或环境变量设置后端地址。

## 构建

```bash
# H5 生产包
npm run build:h5

# 微信小程序生产包
npm run build:weapp

# APP（RN）bundle，可指定平台
npm run build:rn -- --platform ios
npm run build:rn -- --platform android
```

## 页面与功能

| 页面       | 路径                    | 说明                         |
|------------|-------------------------|------------------------------|
| 酒店查询页 | `/pages/index/index`    | Banner、城市/关键字/入住离店、日历、星级、快捷标签、查询跳列表 |
| 酒店列表页 | `/pages/hotel-list/index` | 筛选头、搜索、列表、上滑加载更多 |
| 酒店详情页 | `/pages/hotel-detail/index` | 导航头、大图轮播、基础信息、日历+间夜、房型价格列表（按价格从低到高） |

- **日历组件**：`src/components/Calendar`，用于入住/离店日期选择，多端共用。
- **请求**：`src/services/request.ts` 基于 `Taro.request`，`src/services/api.ts` 与原有 `publicHotelApi` 接口对齐。

## 与 hotel-mobile（Vite H5）的关系

- **hotel-mobile**：Vite + React 单 H5 端，可继续保留或下线。
- **hotel-mobile-taro**：Taro 多端版，优先维护；同一套业务逻辑与后端 API，产出 H5 + 小程序 + APP（RN）。
