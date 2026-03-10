import { useEffect, useRef } from 'react';
import { getApiBaseCacheKey } from '../services/request';
import { platform } from '../styles/rn-utils';

export type PriceUpdateChangeKind =
  | 'price_changed'
  | 'hotel_updated'
  | 'hotel_online'
  | 'hotel_offline'
  | 'hotel_hidden'
  | 'keepalive';

export interface PriceUpdateEvent {
  type: string;
  timestamp: number;
  hotelId?: number;
  changeKind: PriceUpdateChangeKind;
  version?: number;
}

interface UsePriceUpdatesOptions {
  enabled?: boolean;
  throttleMs?: number;
  onPriceUpdate?: (event: PriceUpdateEvent) => void;
}

function buildSseUrl(): string {
  const base = getApiBaseCacheKey();
  if (!base || base === 'relative' || base === 'unknown') {
    return '/api/v1/public/hotels/price-updates';
  }
  return `${base.replace(/\/$/, '')}/api/v1/public/hotels/price-updates`;
}

function toSafeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return fallback;
}

function normalizeChangeKind(value: unknown): PriceUpdateChangeKind {
  const valid: PriceUpdateChangeKind[] = [
    'price_changed',
    'hotel_updated',
    'hotel_online',
    'hotel_offline',
    'hotel_hidden',
    'keepalive',
  ];
  if (typeof value === 'string' && valid.includes(value as PriceUpdateChangeKind)) {
    return value as PriceUpdateChangeKind;
  }
  return 'keepalive';
}

function parsePriceUpdateEvent(raw: unknown): PriceUpdateEvent {
  let data: unknown = raw;
  if (typeof raw === 'string') {
    try {
      data = JSON.parse(raw);
    } catch {
      data = undefined;
    }
  }
  if (!data || typeof data !== 'object') {
    return {
      type: 'hotel_price_update',
      timestamp: Date.now(),
      changeKind: 'keepalive',
    };
  }

  const obj = data as Record<string, unknown>;
  const hotelId = toSafeNumber(obj.hotelId, Number.NaN);

  return {
    type: typeof obj.type === 'string' ? obj.type : 'hotel_price_update',
    timestamp: toSafeNumber(obj.timestamp, Date.now()),
    hotelId: Number.isFinite(hotelId) ? hotelId : undefined,
    changeKind: normalizeChangeKind(obj.changeKind),
    version: Number.isFinite(toSafeNumber(obj.version, Number.NaN))
      ? toSafeNumber(obj.version, Number.NaN)
      : undefined,
  };
}

/** 价格更新 SSE（仅 H5），连接失败指数退避重连。 */
export function usePriceUpdates(options: UsePriceUpdatesOptions) {
  const {
    enabled = true,
    throttleMs = 5000,
    onPriceUpdate,
  } = options;
  const lastKeepaliveTriggerRef = useRef(0);
  // 用 ref 稳定回调引用，避免 onPriceUpdate 变化导致 SSE 重连
  const onPriceUpdateRef = useRef(onPriceUpdate);
  useEffect(() => {
    onPriceUpdateRef.current = onPriceUpdate;
  }, [onPriceUpdate]);

  useEffect(() => {
    if (!enabled || !onPriceUpdateRef.current) return;
    if (!platform.isH5) return;
    if (typeof EventSource === 'undefined') return;

    let closed = false;
    let source: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    const MAX_RECONNECT_DELAY = 30_000;
    const sseUrl = buildSseUrl();

    const triggerUpdate = (event: PriceUpdateEvent) => {
      if (event.changeKind === 'keepalive') {
        const now = Date.now();
        if (now - lastKeepaliveTriggerRef.current < throttleMs) return;
        lastKeepaliveTriggerRef.current = now;
      }
      onPriceUpdateRef.current?.(event);
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
      source.onmessage = (event) => {
        reconnectAttempt = 0; // 收到消息说明连接正常，重置退避计数
        triggerUpdate(parsePriceUpdateEvent(event.data));
      };
      source.onerror = () => {
        source?.close();
        source = null;
        if (closed) return;
        // 指数退避 + 随机抖动
        reconnectAttempt++;
        const baseDelay = Math.min(1000 * Math.pow(2, reconnectAttempt), MAX_RECONNECT_DELAY);
        const jitter = Math.random() * 1000;
        reconnectTimer = setTimeout(connect, baseDelay + jitter);
      };
    };

    connect();

    return () => {
      closed = true;
      clearReconnect();
      source?.close();
      source = null;
    };
  }, [enabled, throttleMs]);
}
