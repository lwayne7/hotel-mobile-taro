import { ScrollView, View, Text } from '@tarojs/components';
import type { Hotel } from '../../../types/hotel';
import { HotelCard, Skeleton } from '../../../components/ui';
import './GeneralFilter.scss'; // 复用列表区域已有样式

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
  return (
    <ScrollView
      scrollY
      className="ctrip-list-scroll"
      onScrollToLower={onScrollToLower}
      lowerThreshold={100}
    >
      {isLoading ? (
        <View className="ctrip-list-content">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} loading rows={3} avatar />
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
          {isWeappDevtools && apiBaseDebugText && (
            <Text className="ctrip-empty-debug">{apiBaseDebugText}</Text>
          )}
        </View>
      ) : (
        <View className="ctrip-list-content">
          <Text className="ctrip-list-total">共 {total} 家酒店</Text>
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} onClick={onCardClick} />
          ))}
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

