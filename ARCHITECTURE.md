# 易宿 Taro 用户端：跨端一致性与数据流架构

本文描述 `hotel-mobile-taro/` 的核心设计点：一套代码适配 H5/小程序/RN 的差异收敛、数据获取策略与实时价格更新链路。

## 分层与数据流

```mermaid
flowchart TD
  Pages[Pages] --> Hooks[Hooks]
  Pages --> Components[Components]
  Hooks --> Services[services/api]
  Services --> Backend[hotel-management Backend]
  Hooks --> Store[ZustandStore(persist)]
  Hooks --> Query[TanStackQuery]
```

- **页面层**：`src/pages/*`（index / hotel-list / hotel-detail / favorites）。
- **hooks 层**：封装请求、分页、SSE 订阅与平台差异（`useHotels`、`usePriceUpdates`、`useWeappFetch`、`useIsWeapp`）。
- **状态层**：
  - **Zustand + persist**：收藏/浏览历史、搜索条件等“客户端状态”跨端持久化。
  - **TanStack Query**：酒店列表/详情等“服务端状态”缓存、分页与定时刷新。

## 关键：跨端差异收敛

### 平台判断

- `useIsWeapp`：通过 `Taro.getEnv()` 判断是否小程序环境，作为分支开关。

### weapp 环境下的“查询能力兜底”

小程序运行时对部分能力/依赖的支持与 H5 不完全一致，因此提供：

- `useWeappFetch(fetchFn)`：在 weapp 环境下用 `useEffect + useState` 实现“统一的加载态/错误态/refetch 接口”，作为 TanStack Query 的轻量替代。

## 缓存与刷新策略（服务端状态）

- 列表：`useInfiniteQuery` 无限滚动 + `refetchInterval: 60s`（前台刷新，后台不刷）。
- 详情：`useQuery` + `refetchInterval: 30s`（避免详情价格长期不一致）。
- QueryKey：包含 `getApiBaseCacheKey()`，确保切换 API Base 时缓存隔离。

