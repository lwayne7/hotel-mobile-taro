import { useCallback } from 'react';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useSearchStore } from '../store/useSearchStore';
import { toQueryString } from '../utils/queryString';

/**
 * 搜索相关 Hook，封装搜索参数和导航逻辑
 * 使用 Zustand 选择器模式优化性能
 */
export function useSearch() {
  // 使用选择器提取需要的状态，避免整体 store 变化导致重渲染
  const city = useSearchStore((s) => s.city);
  const keyword = useSearchStore((s) => s.keyword);
  const checkIn = useSearchStore((s) => s.checkIn);
  const checkOut = useSearchStore((s) => s.checkOut);
  const starRating = useSearchStore((s) => s.starRating);
  const minPrice = useSearchStore((s) => s.minPrice);
  const maxPrice = useSearchStore((s) => s.maxPrice);

  const navigateToList = useCallback(() => {
    const queryString = toQueryString({
      city,
      keyword,
      checkIn,
      checkOut,
      starRating: starRating > 0 ? starRating : undefined,
      minPrice,
      maxPrice,
    });
    Taro.navigateTo({
      url: `/pages/hotel-list/index${queryString ? `?${queryString}` : ''}`,
    });
  }, [city, keyword, checkIn, checkOut, starRating, minPrice, maxPrice]);

  const navigateToDetail = useCallback(
    (hotelId: number) => {
      const queryString = toQueryString({ checkIn, checkOut });
      Taro.navigateTo({
        url: `/pages/hotel-detail/index?id=${hotelId}${queryString ? `&${queryString}` : ''}`,
      });
    },
    [checkIn, checkOut]
  );

  const nights = useCallback(() => {
    if (!checkIn || !checkOut) return 1;
    return Math.max(1, dayjs(checkOut).diff(dayjs(checkIn), 'day'));
  }, [checkIn, checkOut]);

  return {
    city,
    keyword,
    checkIn,
    checkOut,
    starRating,
    minPrice,
    maxPrice,
    navigateToList,
    navigateToDetail,
    nights: nights(),
  };
}
