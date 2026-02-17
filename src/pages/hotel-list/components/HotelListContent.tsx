import { useState, useCallback, useMemo, useRef } from 'react';
import { ScrollView, View, Text } from '@tarojs/components';
import type { Hotel } from '../../../types/hotel';
import { HotelCard } from '../../../components/ui';
import './GeneralFilter.scss';

/** Hotel card skeleton that mimics the actual card shape */
function HotelCardSkeleton() {
  return (
    <View style={{ display: 'flex', flexDirection: 'row', background: '#fff', borderRadius: '12px', marginBottom: '12px', padding: '12px' }}>
      <View style={{ width: '120px', height: '120px', borderRadius: '10px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      <View style={{ flex: 1, marginLeft: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <View style={{ height: '16px', width: '70%', borderRadius: '4px', background: '#f0f0f0' }} />
        <View style={{ height: '12px', width: '90%', borderRadius: '4px', background: '#f5f5f5', marginTop: '8px' }} />
        <View style={{ display: 'flex', flexDirection: 'row', gap: '6px', marginTop: '8px' }}>
          <View style={{ height: '20px', width: '50px', borderRadius: '4px', background: '#f0f5ff' }} />
          <View style={{ height: '20px', width: '50px', borderRadius: '4px', background: '#f0f5ff' }} />
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <View style={{ height: '20px', width: '40px', borderRadius: '4px', background: '#e6f4ff' }} />
          <View style={{ height: '22px', width: '60px', borderRadius: '4px', background: '#fff5f0' }} />
        </View>
      </View>
    </View>
  );
}

/** Estimated height per HotelCard in px */
const ITEM_HEIGHT = 136;
/** Extra items rendered above/below the visible area */
const OVERSCAN = 8;
/** Only activate virtual scrolling when list exceeds this count */
const VIRTUALIZE_THRESHOLD = 30;

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
  const [renderRange, setRenderRange] = useState({ start: 0, end: 50 });

  const shouldVirtualize = hotels.length > VIRTUALIZE_THRESHOLD;

  const handleScroll = useCallback(
    (e: any) => {
      const newScrollTop: number = e.detail?.scrollTop ?? 0;

      if (!shouldVirtualize) {
        scrollTopRef.current = newScrollTop;
        return;
      }

      if (Math.abs(newScrollTop - scrollTopRef.current) < ITEM_HEIGHT) return;
      scrollTopRef.current = newScrollTop;

      const viewportHeight = 700;
      const start = Math.max(0, Math.floor(newScrollTop / ITEM_HEIGHT) - OVERSCAN);
      const visibleCount = Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2;
      const end = Math.min(hotels.length, start + visibleCount);

      setRenderRange((prev) => {
        if (prev.start === start && prev.end === end) return prev;
        return { start, end };
      });
    },
    [shouldVirtualize, hotels.length],
  );

  const { visibleHotels, topPadding, bottomPadding } = useMemo(() => {
    if (!shouldVirtualize) {
      return { visibleHotels: hotels, topPadding: 0, bottomPadding: 0 };
    }
    const { start, end } = renderRange;
    const safeEnd = Math.min(end, hotels.length);
    return {
      visibleHotels: hotels.slice(start, safeEnd),
      topPadding: start * ITEM_HEIGHT,
      bottomPadding: Math.max(0, (hotels.length - safeEnd) * ITEM_HEIGHT),
    };
  }, [hotels, renderRange, shouldVirtualize]);

  return (
    <ScrollView
      scrollY
      className="ctrip-list-scroll"
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
