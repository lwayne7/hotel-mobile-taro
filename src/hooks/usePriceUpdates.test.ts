/**
 * usePriceUpdates SSE hook 测试
 *
 * 测试点：
 * 1. H5 环境下正常创建 EventSource 连接
 * 2. 接收并解析 price_changed 事件
 * 3. keepalive 节流
 * 4. 断线 5s 后自动重连
 * 5. 组件卸载时正确清理资源
 * 6. 非 H5 环境不创建连接
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePriceUpdates } from './usePriceUpdates';
import type { PriceUpdateEvent } from './usePriceUpdates';

// Mock platform 检测
vi.mock('../styles/rn-utils', () => ({
    platform: { isH5: true, isWeapp: false, isRN: false },
}));

// ============ Mock EventSource ============
class MockEventSource {
    static instances: MockEventSource[] = [];
    url: string;
    onmessage: ((event: { data: string }) => void) | null = null;
    onerror: (() => void) | null = null;
    readyState = 0;
    closed = false;

    constructor(url: string) {
        this.url = url;
        this.readyState = 1; // OPEN
        MockEventSource.instances.push(this);
    }

    close() {
        this.closed = true;
        this.readyState = 2; // CLOSED
    }

    // 模拟接收消息
    simulateMessage(data: Record<string, unknown>) {
        if (this.onmessage && !this.closed) {
            this.onmessage({ data: JSON.stringify(data) });
        }
    }

    // 模拟断线
    simulateError() {
        if (this.onerror && !this.closed) {
            this.onerror();
        }
    }
}

describe('usePriceUpdates', () => {
    beforeEach(() => {
        MockEventSource.instances = [];
        vi.useFakeTimers();
        // @ts-ignore
        globalThis.EventSource = MockEventSource;
    });

    afterEach(() => {
        vi.useRealTimers();
        // @ts-ignore
        delete globalThis.EventSource;
    });

    it('should create EventSource connection on H5', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        expect(MockEventSource.instances).toHaveLength(1);
        expect(MockEventSource.instances[0].url).toContain('price-updates');
    });

    it('should not create connection when disabled', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ enabled: false, onPriceUpdate }));

        expect(MockEventSource.instances).toHaveLength(0);
    });

    it('should parse and forward price_changed events', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        const source = MockEventSource.instances[0];

        act(() => {
            source.simulateMessage({
                type: 'hotel_price_update',
                timestamp: Date.now(),
                hotelId: 42,
                changeKind: 'price_changed',
                version: 1,
            });
        });

        expect(onPriceUpdate).toHaveBeenCalledTimes(1);
        const event: PriceUpdateEvent = onPriceUpdate.mock.calls[0][0];
        expect(event.changeKind).toBe('price_changed');
        expect(event.hotelId).toBe(42);
    });

    it('should throttle keepalive events', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate, throttleMs: 5000 }));

        const source = MockEventSource.instances[0];

        // 第一次 keepalive 应该通过
        act(() => {
            source.simulateMessage({
                type: 'hotel_price_update',
                timestamp: Date.now(),
                changeKind: 'keepalive',
            });
        });
        expect(onPriceUpdate).toHaveBeenCalledTimes(1);

        // 第二次 keepalive（5s 内）应该被节流
        act(() => {
            source.simulateMessage({
                type: 'hotel_price_update',
                timestamp: Date.now(),
                changeKind: 'keepalive',
            });
        });
        expect(onPriceUpdate).toHaveBeenCalledTimes(1); // 仍然是 1

        // 5s 后的 keepalive 应该通过
        act(() => {
            vi.advanceTimersByTime(5001);
            source.simulateMessage({
                type: 'hotel_price_update',
                timestamp: Date.now(),
                changeKind: 'keepalive',
            });
        });
        expect(onPriceUpdate).toHaveBeenCalledTimes(2);
    });

    it('should not throttle non-keepalive events', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        const source = MockEventSource.instances[0];

        // 连续发两次 price_changed，都应通过
        act(() => {
            source.simulateMessage({ changeKind: 'price_changed', hotelId: 1 });
        });
        act(() => {
            source.simulateMessage({ changeKind: 'price_changed', hotelId: 2 });
        });
        expect(onPriceUpdate).toHaveBeenCalledTimes(2);
    });

    it('should reconnect after 5s on error', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        expect(MockEventSource.instances).toHaveLength(1);
        const firstSource = MockEventSource.instances[0];

        // 模拟断线
        act(() => {
            firstSource.simulateError();
        });
        expect(firstSource.closed).toBe(true);

        // 5s 前不应重连
        expect(MockEventSource.instances).toHaveLength(1);

        // 5s 后应重连
        act(() => {
            vi.advanceTimersByTime(5001);
        });
        expect(MockEventSource.instances).toHaveLength(2);
        expect(MockEventSource.instances[1].closed).toBe(false);
    });

    it('should cleanup on unmount', () => {
        const onPriceUpdate = vi.fn();
        const { unmount } = renderHook(() => usePriceUpdates({ onPriceUpdate }));

        const source = MockEventSource.instances[0];
        expect(source.closed).toBe(false);

        unmount();
        expect(source.closed).toBe(true);
    });

    it('should handle malformed JSON gracefully', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        const source = MockEventSource.instances[0];

        // 直接调 onmessage 传入非法 JSON
        act(() => {
            if (source.onmessage) {
                source.onmessage({ data: 'not-valid-json' });
            }
        });

        // 应该仍然调用回调（解析为 keepalive fallback）
        expect(onPriceUpdate).toHaveBeenCalledTimes(1);
        expect(onPriceUpdate.mock.calls[0][0].changeKind).toBe('keepalive');
    });

    it('should normalize unknown changeKind to keepalive', () => {
        const onPriceUpdate = vi.fn();
        renderHook(() => usePriceUpdates({ onPriceUpdate }));

        const source = MockEventSource.instances[0];

        act(() => {
            source.simulateMessage({ changeKind: 'unknown_event' });
        });

        // 第一次 keepalive 被放行
        expect(onPriceUpdate).toHaveBeenCalledTimes(1);
        expect(onPriceUpdate.mock.calls[0][0].changeKind).toBe('keepalive');
    });
});
