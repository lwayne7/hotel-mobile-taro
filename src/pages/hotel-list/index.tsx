/**
 * 酒店列表页 - 修复版本
 * 
 * 修复内容：
 * 1. 类名与 SCSS 保持一致（ctrip- 前缀）
 * 2. 使用正确的 Zustand 选择器
 */
import React, { useMemo, useCallback } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useInfiniteHotelList, flattenHotelPages, getTotalFromPages } from '../../hooks/useHotels';
import { useSearchStore } from '../../store/useSearchStore';
import { useHotelStore } from '../../store/useHotelStore';
import { HotelCard, Skeleton } from '../../components/ui';
import type { Hotel, HotelListResponse } from '../../types/hotel';
import { toQueryString } from '../../utils/queryString';
import { getApiBaseCacheKey } from '../../services/request';
import dayjs from 'dayjs';
import './index.scss';

const PAGE_SIZE = 10;
const SORT_OPTIONS = [
  { key: 'popular', label: '欢迎度排序' },
  { key: 'distance', label: '位置距离' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];

function decodeParam(value: string | undefined): string {
  if (!value || typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function HotelList() {
  const router = useRouter();
  const rawParams = router.params || {};
  const isWeappDevtools = useMemo(() => {
    if (process.env.TARO_ENV !== 'weapp') return false;
    try {
      return Taro.getSystemInfoSync().platform === 'devtools';
    } catch {
      return false;
    }
  }, []);

  // Zustand - 使用选择器
  const city = useSearchStore((s) => s.city);
  const keyword = useSearchStore((s) => s.keyword);
  const starRating = useSearchStore((s) => s.starRating);
  const minPrice = useSearchStore((s) => s.minPrice);
  const maxPrice = useSearchStore((s) => s.maxPrice);
  const storeCheckIn = useSearchStore((s) => s.checkIn);
  const storeCheckOut = useSearchStore((s) => s.checkOut);
  const setKeyword = useSearchStore((s) => s.setKeyword);
  const addToRecentlyViewed = useHotelStore((s) => s.addToRecentlyViewed);

  // 本地 UI 状态
  const [sortBy, setSortBy] = React.useState('popular');
  const [localKeyword, setLocalKeyword] = React.useState(
    decodeParam(rawParams.keyword) || keyword
  );

  // 搜索参数
  const searchParams = useMemo(
    () => ({
      city: decodeParam(rawParams.city) || city || '上海',
      keyword: localKeyword.trim() || undefined,
      starRating: Number(rawParams.starRating) || starRating || undefined,
      minPrice: minPrice,
      maxPrice: maxPrice,
      pageSize: PAGE_SIZE,
    }),
    [rawParams.city, rawParams.starRating, city, localKeyword, starRating, minPrice, maxPrice]
  );

  // 使用 TanStack Query 的无限滚动 hook
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteHotelList(searchParams);

  // 扁平化分页数据
  const hotels = flattenHotelPages(data as { pages: HotelListResponse[] } | undefined);
  const total = getTotalFromPages(data as { pages: HotelListResponse[] } | undefined);

  // 日期计算
  const checkIn = rawParams.checkIn ? dayjs(rawParams.checkIn) : dayjs(storeCheckIn);
  const checkOut = rawParams.checkOut ? dayjs(rawParams.checkOut) : dayjs(storeCheckOut);
  const nights = Math.max(1, checkOut.diff(checkIn, 'day'));

  // 处理搜索
  const handleSearch = useCallback(() => {
    setKeyword(localKeyword);
    refetch();
  }, [localKeyword, setKeyword, refetch]);

  // 处理滚动加载更多
  const handleScrollToLower = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // 处理卡片点击
  const handleCardClick = useCallback((hotel: Hotel) => {
    addToRecentlyViewed(hotel);
    const queryString = toQueryString({
      id: hotel.id,
      checkIn: rawParams.checkIn,
      checkOut: rawParams.checkOut,
    });
    Taro.navigateTo({ url: `/pages/hotel-detail/index?${queryString}` });
  }, [addToRecentlyViewed, rawParams.checkIn, rawParams.checkOut]);

  const goBack = useCallback(() => {
    Taro.navigateBack().catch(() => {
      Taro.redirectTo({ url: '/pages/index/index' });
    });
  }, []);

  return (
    <View className="ctrip-list">
      {/* Header */}
      <View className="ctrip-list-header">
        <View className="ctrip-back-btn" onClick={goBack}>
          <Text className="back-arrow">‹</Text>
        </View>
        <View className="ctrip-list-search-box">
          <View className="search-box-row">
            <Text className="search-city">{searchParams.city}</Text>
            <Text className="search-dates">
              {checkIn.format('MM-DD')} - {checkOut.format('MM-DD')}
            </Text>
            <Text className="search-nights">{nights}晚</Text>
          </View>
          <View className="search-box-input">
            <Text className="search-icon">🔍</Text>
            <Input
              className="search-input-inner"
              placeholder="搜索酒店/地名/商圈"
              placeholderClass="search-placeholder"
              value={localKeyword}
              onInput={(e) => setLocalKeyword(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>
        </View>
        <View className="ctrip-list-map">
          <Text className="map-text">📍地图</Text>
        </View>
      </View>

      {/* Filters */}
      <View className="ctrip-list-filters">
        <View className="filter-row-main">
          {SORT_OPTIONS.map((opt) => (
            <View
              key={opt.key}
              className={`ctrip-filter-item ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => setSortBy(opt.key)}
            >
              <Text>{opt.label}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          ))}
        </View>
        <View className="filter-row-quick">
          <View className="filter-row-quick-inner">
            {['外滩', '双床房', '含早餐', '免费兑早餐', '可订'].map((tag) => (
              <Text
                key={tag}
                className={`ctrip-quick-filter-tag ${localKeyword === tag ? 'active' : ''}`}
                onClick={() => {
                  if (localKeyword === tag) {
                    setLocalKeyword('');
                    setKeyword('');
                  } else {
                    setLocalKeyword(tag);
                    setKeyword(tag);
                  }
                  refetch();
                }}
              >
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        scrollY
        className="ctrip-list-scroll"
        onScrollToLower={handleScrollToLower}
        lowerThreshold={100}
      >
        {isLoading ? (
          // 骨架屏
          <View className="ctrip-list-content">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} loading rows={3} avatar />
            ))}
          </View>
        ) : isError ? (
          // 错误状态
          <View className="ctrip-empty">
            <Text className="ctrip-empty-msg">{error?.message || '加载失败'}</Text>
            <View className="ctrip-empty-actions">
              <Text className="ctrip-empty-retry" onClick={() => refetch()}>重试</Text>
            </View>
          </View>
        ) : hotels.length === 0 ? (
          // 空状态
          <View className="ctrip-empty">
            <Text className="ctrip-empty-msg">暂无符合条件的酒店</Text>
            <Text className="ctrip-empty-hint">试试调整搜索条件？</Text>
            {isWeappDevtools && (
              <Text className="ctrip-empty-debug">Debug: API_BASE={getApiBaseCacheKey()}</Text>
            )}
          </View>
        ) : (
          // 酒店列表
          <View className="ctrip-list-content">
            <Text style={{ color: '#999', fontSize: '12px', marginBottom: '8px', display: 'block' }}>
              共 {total} 家酒店
            </Text>
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                nights={nights}
                onClick={handleCardClick}
              />
            ))}
            {isFetchingNextPage && (
              <View className="ctrip-list-more">
                <Text>加载中...</Text>
              </View>
            )}
            {!hasNextPage && hotels.length > 0 && (
              <View className="ctrip-list-more-hint">
                <Text>已加载全部</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
