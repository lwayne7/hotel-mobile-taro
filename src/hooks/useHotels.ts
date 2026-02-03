import { useQuery, useInfiniteQuery, UseQueryOptions } from '@tanstack/react-query';
import { publicHotelApi } from '../services/api';
import { getApiBaseCacheKey } from '../services/request';
import type { Hotel, HotelListResponse } from '../types/hotel';

// ============ 查询键常量 ============
export const hotelKeys = {
  all: () => ['hotels', getApiBaseCacheKey()] as const,
  lists: () => [...hotelKeys.all(), 'list'] as const,
  list: (params: HotelSearchParams) => [...hotelKeys.lists(), params] as const,
  details: () => [...hotelKeys.all(), 'detail'] as const,
  detail: (id: number) => [...hotelKeys.details(), id] as const,
};

// ============ 类型定义 ============
export interface HotelSearchParams {
  keyword?: string;
  city?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  // 综合筛选参数
  facilities?: string;
  brands?: string;
  hotelFeatures?: string;
  roomFeatures?: string;
  pageSize?: number;
}

// ============ 酒店列表 Hook ============
export function useHotelList(
  params: HotelSearchParams & { page?: number },
  options?: Omit<UseQueryOptions<HotelListResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: hotelKeys.list(params),
    queryFn: () => publicHotelApi.getList(params),
    ...options,
  });
}

// ============ 无限滚动酒店列表 Hook ============
export function useInfiniteHotelList(params: HotelSearchParams) {
  return useInfiniteQuery({
    queryKey: hotelKeys.list(params),
    queryFn: ({ pageParam }) =>
      publicHotelApi.getList({ ...params, page: pageParam as number, pageSize: params.pageSize || 10 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: HotelListResponse) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
  });
}

// ============ 酒店详情 Hook ============
export function useHotelDetail(
  id: number | undefined,
  options?: Omit<UseQueryOptions<Hotel, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: hotelKeys.detail(id!),
    queryFn: () => publicHotelApi.getById(id!),
    enabled: !!id,
    ...options,
  });
}

// ============ 工具函数 ============
/**
 * 从无限滚动结果中提取扁平化的酒店列表
 */
export function flattenHotelPages(data: { pages: HotelListResponse[] } | undefined): Hotel[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((page) => page.data || []);
}

/**
 * 获取总数
 */
export function getTotalFromPages(data: { pages: HotelListResponse[] } | undefined): number {
  if (!data?.pages?.length) return 0;
  return data.pages[0].total || 0;
}
