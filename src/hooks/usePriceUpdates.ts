import { useEffect, useRef } from 'react';
import { getApiBaseCacheKey } from '../services/request';
import { platform } from '../styles/rn-utils';

interface UsePriceUpdatesOptions {
  enabled?: boolean;
  throttleMs?: number;
  onPriceUpdate?: () => void;
}

function buildSseUrl(): string {
  const base = getApiBaseCacheKey();
  if (!base || base === 'relative' || base === 'unknown') {
    return '/api/public/hotels/price-updates';
  }
  return `${base.replace(/\/$/, '')}/api/public/hotels/price-updates`;
}

/** 价格更新 SSE（仅 H5），连接失败自动重连，业务层可继续保留轮询兜底。 */
export function usePriceUpdates(options: UsePriceUpdatesOptions) {
  const {
    enabled = true,
    throttleMs = 5000,
    onPriceUpdate,
  } = options;
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!enabled || !onPriceUpdate) return;
    if (!platform.isH5) return;
    if (typeof EventSource === 'undefined') return;

    let closed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const sseUrl = buildSseUrl();

    const triggerUpdate = () => {
      const now = Date.now();
      if (now - lastTriggerRef.current < throttleMs) return;
      lastTriggerRef.current = now;
      onPriceUpdate();
    };

    const clearReconnect = () => {
      if (!reconnectTimer) return;
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    };

    const connect = () => {
      if (closed) return;
      clearReconnect();

      source = new EventSource(sseUrl);
      source.onmessage = () => {
        triggerUpdate();
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      closed = true;
      clearReconnect();
      source?.close();
      source = null;
    };
  }, [enabled, onPriceUpdate, throttleMs]);
}

