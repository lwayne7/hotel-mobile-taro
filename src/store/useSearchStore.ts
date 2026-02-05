import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import dayjs from 'dayjs';
import { taroStorage } from './storage';

// ============ 类型定义 ============
export interface SearchState {
  // 搜索参数
  city: string;
  keyword: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  starRating: number;
  priceRange: string; // 价格区间文本，如 '不限', '¥150以下' 等
  minPrice?: number;
  maxPrice?: number;

  // 操作方法
  setCity: (city: string) => void;
  setKeyword: (keyword: string) => void;
  setCheckIn: (checkIn: string) => void;
  setCheckOut: (checkOut: string) => void;
  setDateRange: (checkIn: string, checkOut: string) => void;
  setStarRating: (rating: number) => void;
  setPriceRange: (priceRange: string) => void;
  setPriceRangeValues: (min?: number, max?: number) => void;
  reset: () => void;
  resetFilters: () => void;
}

// ============ 默认值 ============
const getDefaultState = () => ({
  city: '上海',
  keyword: '',
  checkIn: dayjs().format('YYYY-MM-DD'),
  checkOut: dayjs().add(1, 'day').format('YYYY-MM-DD'),
  starRating: 0,
  priceRange: '不限',
  minPrice: undefined,
  maxPrice: undefined,
});

// ============ Store ============
export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      ...getDefaultState(),

      setCity: (city) => set({ city }),

      setKeyword: (keyword) => set({ keyword }),

      setCheckIn: (checkIn) => set({ checkIn }),

      setCheckOut: (checkOut) => set({ checkOut }),

      setDateRange: (checkIn, checkOut) => set({ checkIn, checkOut }),

      setStarRating: (starRating) => set({ starRating }),

      setPriceRange: (priceRange) => set({ priceRange }),

      setPriceRangeValues: (minPrice, maxPrice) => set({ minPrice, maxPrice }),

      reset: () => set(getDefaultState()),

      resetFilters: () => set({ starRating: 0, priceRange: '不限', minPrice: undefined, maxPrice: undefined }),
    }),
    {
      name: 'hotel-search-store',
      storage: createJSONStorage(() => taroStorage),
      // 只持久化部分字段
      partialize: (state) => ({
        city: state.city,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
      }),
    }
  )
);
