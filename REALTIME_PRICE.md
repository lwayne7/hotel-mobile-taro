# 易宿 Taro 用户端：实时价格方案（SSE + 轮询）

目标：在“价格/房态频繁变化”的列表与详情页，做到更新及时、可控耗电/流量、跨端可用。

## 方案概览

```mermaid
flowchart TD
  H5[H5] -->|EventSource(SSE)| BackendSSE[/public/hotels/price-updates/]
  Weapp[Weapp] -->|Polling| BackendREST[/public/hotels/]
  RN[ReactNative] -->|Polling| BackendREST
```

## H5：SSE（EventSource）订阅

实现位于 `src/hooks/usePriceUpdates.ts`：

- **仅在 H5 启用**：`platform.isH5` + `typeof EventSource !== 'undefined'`
- **自动重连**：`onerror` 关闭后 5s 重连
- **keepalive 节流**：对 `keepalive` 事件做 `throttleMs`（默认 5000ms），避免无意义频繁刷新
- **事件解析**：对 `timestamp/hotelId/changeKind/version` 做安全归一化，脏数据回退到 `keepalive`

## 小程序 / RN：轮询兜底

原因：小程序与 RN 运行时对 EventSource 支持不一致/不可用，因此采用轮询作为兜底策略。

建议落地方式（与现有 Query 刷新配合）：

- 列表：沿用 `useInfiniteQuery` 的 `refetchInterval: 60s`
- 详情：沿用 `useHotelDetail` 的 `refetchInterval: 30s`
- 触发条件：页面可见时刷新，后台不刷（当前实现已设置 `refetchIntervalInBackground: false`）

