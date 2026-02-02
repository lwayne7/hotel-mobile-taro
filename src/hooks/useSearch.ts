import { useCallback } from 'react';
import Taro from '@tarojs/taro';
import dayjs from 'dayjs';
import { useSearchStore } from '../store/useSearchStore';

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
    const query = new URLSearchParams();
    if (city) query.set('city', city);
    if (keyword) query.set('keyword', keyword);
    if (checkIn) query.set('checkIn', checkIn);
    if (checkOut) query.set('checkOut', checkOut);
    if (starRating > 0) query.set('starRating', String(starRating));
    if (minPrice !== undefined) query.set('minPrice', String(minPrice));
    if (maxPrice !== undefined) query.set('maxPrice', String(maxPrice));

    const queryString = query.toString();
    Taro.navigateTo({
      url: `/pages/hotel-list/index${queryString ? `?${queryString}` : ''}`,
    });
  }, [city, keyword, checkIn, checkOut, starRating, minPrice, maxPrice]);

  const navigateToDetail = useCallback(
    (hotelId: number) => {
      const query = new URLSearchParams();
      if (checkIn) query.set('checkIn', checkIn);
      if (checkOut) query.set('checkOut', checkOut);

      const queryString = query.toString();
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
