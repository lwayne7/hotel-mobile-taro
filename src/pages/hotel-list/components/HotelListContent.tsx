import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ScrollView, View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import type { Hotel } from '../../../types/hotel';
import { HotelCard } from '../../../components/ui';
import './GeneralFilter.scss';

/** Hotel card skeleton that mimics the actual card shape */
function HotelCardSkeleton() {
  return (
    <View className="hotel-card-skeleton">
      <View className="hotel-card-skeleton-image" />
      <View className="hotel-card-skeleton-body">
        <View className="hotel-card-skeleton-line skeleton-line-title" />
        <View className="hotel-card-skeleton-line skeleton-line-subtitle" />
        <View className="hotel-card-skeleton-tags">
          <View className="hotel-card-skeleton-tag" />
          <View className="hotel-card-skeleton-tag" />
        </View>
        <View className="hotel-card-skeleton-footer">
          <View className="hotel-card-skeleton-score" />
          <View className="hotel-card-skeleton-price" />
        </View>
      </View>
    </View>
  );
}

/** Fallback row height when measurement is not ready */
const DEFAULT_ITEM_HEIGHT = 196;
/** Fallback viewport height when measurement is not ready */
const DEFAULT_VIEWPORT_HEIGHT = 700;
/** Lower bound for viewport used in window calculation */
const MIN_VIEWPORT_HEIGHT = 320;
/** HotelCard bottom gap (margin-bottom) in px */
const ITEM_GAP = 12;
/** Extra items rendered above/below the visible area */
const OVERSCAN = 8;
/** Only activate virtual scrolling when list exceeds this count */
const VIRTUALIZE_THRESHOLD = 30;
/** Interval to batch scroll range updates */
const SCROLL_BATCH_MS = 16;

interface ScrollEventDetail {
  detail?: {
    scrollTop?: number;
  };
}

interface RectLike {
  height?: number;
}

function clampToPositiveInt(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.round(value);
}

function getRenderRange(
  scrollTop: number,
  total: number,
  itemHeight: number,
  viewportHeight: number,
) {
  if (total <= 0) return { start: 0, end: 0 };
  const safeItemHeight = Math.max(1, itemHeight);
  const safeViewportHeight = Math.max(MIN_VIEWPORT_HEIGHT, viewportHeight);
  const start = Math.max(0, Math.floor(scrollTop / safeItemHeight) - OVERSCAN);
  const visibleCount = Math.ceil(safeViewportHeight / safeItemHeight) + OVERSCAN * 2;
  const end = Math.min(total, start + Math.max(visibleCount, OVERSCAN * 2 + 1));
  return { start, end };
}

interface HotelListContentProps {
  hotels: Hotel[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isWeappDevtools: boolean;
  apiBaseDebugText?: string;
  onScrollToLower: () => void;
  onRetry: () => void;
  onCardClick: (hotel: Hotel) => void;
}

export function HotelListContent({
  hotels,
  total,
  isLoading,
  isError,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  isWeappDevtools,
  apiBaseDebugText,
  onScrollToLower,
  onRetry,
  onCardClick,
}: HotelListContentProps) {
  const scrollTopRef = useRef(0);
  const updateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [itemHeight, setItemHeight] = useState(DEFAULT_ITEM_HEIGHT);
  const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);
  const [renderRange, setRenderRange] = useState(() => getRenderRange(
    0,
    hotels.length,
    DEFAULT_ITEM_HEIGHT,
    DEFAULT_VIEWPORT_HEIGHT,
  ));

  const shouldVirtualize = hotels.length > VIRTUALIZE_THRESHOLD;

  const updateRenderRange = useCallback(
    (nextScrollTop: number) => {
      if (!shouldVirtualize) return;
      const nextRange = getRenderRange(nextScrollTop, hotels.length, itemHeight, viewportHeight);
      setRenderRange((prev) => {
        if (prev.start === nextRange.start && prev.end === nextRange.end) return prev;
        return nextRange;
      });
    },
    [hotels.length, itemHeight, shouldVirtualize, viewportHeight],
  );

  const measureMetrics = useCallback(() => {
    try {
      const info = Taro.getSystemInfoSync();
      const safeWindowHeight = clampToPositiveInt(info.windowHeight, DEFAULT_VIEWPORT_HEIGHT);
      setViewportHeight(Math.max(MIN_VIEWPORT_HEIGHT, safeWindowHeight));
    } catch {
      // ignore and keep fallback
    }

    const query = Taro.createSelectorQuery();
    query.select('.ctrip-list-scroll').boundingClientRect();
    query.select('.hotel-card').boundingClientRect();
    query.exec((res: Array<RectLike | null>) => {
      const rects = Array.isArray(res) ? res : [];
      const scrollRect = (rects[0] ?? null) as RectLike | null;
      const cardRect = (rects[1] ?? null) as RectLike | null;

      if (scrollRect?.height && scrollRect.height > 0) {
        setViewportHeight(Math.max(MIN_VIEWPORT_HEIGHT, clampToPositiveInt(scrollRect.height, DEFAULT_VIEWPORT_HEIGHT)));
      }
      if (cardRect?.height && cardRect.height > 0) {
        const nextItemHeight = clampToPositiveInt(cardRect.height + ITEM_GAP, DEFAULT_ITEM_HEIGHT);
        setItemHeight(nextItemHeight);
      }
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      measureMetrics();
    }, 0);
    return () => clearTimeout(timer);
  }, [measureMetrics, hotels.length, shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize) {
      setRenderRange({ start: 0, end: hotels.length });
      return;
    }
    updateRenderRange(scrollTopRef.current);
  }, [hotels.length, shouldVirtualize, updateRenderRange]);

  useEffect(() => {
    return () => {
      if (!updateTimerRef.current) return;
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    };
  }, []);

  const handleScroll = useCallback(
    (e: ScrollEventDetail) => {
      const newScrollTop: number = e.detail?.scrollTop ?? 0;
      scrollTopRef.current = newScrollTop;
      if (!shouldVirtualize) {
        return;
      }

      if (updateTimerRef.current) return;
      updateTimerRef.current = setTimeout(() => {
        updateTimerRef.current = null;
        updateRenderRange(scrollTopRef.current);
      }, SCROLL_BATCH_MS);
    },
    [shouldVirtualize, updateRenderRange],
  );

  const { visibleHotels, topPadding, bottomPadding } = useMemo(() => {
    if (!shouldVirtualize) {
      return { visibleHotels: hotels, topPadding: 0, bottomPadding: 0 };
    }
    const { start, end } = renderRange;
    const safeEnd = Math.min(end, hotels.length);
    return {
      visibleHotels: hotels.slice(start, safeEnd),
      topPadding: start * itemHeight,
      bottomPadding: Math.max(0, (hotels.length - safeEnd) * itemHeight),
    };
  }, [hotels, itemHeight, renderRange, shouldVirtualize]);

  return (
    <ScrollView
      scrollY
      enableFlex
      className="ctrip-list-scroll"
      style={{ height: '100%' }}
      onScrollToLower={onScrollToLower}
      onScroll={handleScroll}
      lowerThreshold={100}
    >
      {isLoading ? (
        <View className="ctrip-list-content">
          {[1, 2, 3, 4].map((i) => (
            <HotelCardSkeleton key={i} />
          ))}
        </View>
      ) : isError ? (
        <View className="ctrip-empty">
          <Text className="ctrip-empty-msg">{errorMessage || '加载失败'}</Text>
          <View className="ctrip-empty-actions">
            <Text className="ctrip-empty-retry" onClick={onRetry}>
              重试
            </Text>
          </View>
        </View>
      ) : hotels.length === 0 ? (
        <View className="ctrip-empty">
          <Text className="ctrip-empty-msg">暂无符合条件的酒店</Text>
          <Text className="ctrip-empty-hint">试试调整搜索条件？</Text>
          <View className="ctrip-empty-actions">
            <Text className="ctrip-empty-retry" onClick={onRetry}>
              刷新
            </Text>
          </View>
          {isWeappDevtools && apiBaseDebugText && (
            <Text className="ctrip-empty-debug">{apiBaseDebugText}</Text>
          )}
        </View>
      ) : (
        <View className="ctrip-list-content">
          <Text className="ctrip-list-total">
            共 {total} 家酒店{shouldVirtualize ? '（已启用虚拟滚动）' : ''}
          </Text>
          {topPadding > 0 && <View style={{ height: `${topPadding}px` }} />}
          {visibleHotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} onClick={onCardClick} />
          ))}
          {bottomPadding > 0 && <View style={{ height: `${bottomPadding}px` }} />}
          {isFetchingNextPage && (
            <View className="ctrip-list-loading">
              <Text>加载中...</Text>
            </View>
          )}
          {!hasNextPage && hotels.length > 0 && (
            <View className="ctrip-list-end">
              <Text>已加载全部</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
