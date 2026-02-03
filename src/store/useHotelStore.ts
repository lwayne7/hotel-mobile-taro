import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Taro from '@tarojs/taro';
import type { Hotel } from '../types/hotel';

// Taro 存储适配器
const taroStorage = {
  getItem: (name: string) => {
    try {
      const value = Taro.getStorageSync(name);
      return value || null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      Taro.setStorageSync(name, value);
    } catch {
      console.warn('Storage setItem failed:', name);
    }
  },
  removeItem: (name: string) => {
    try {
      Taro.removeStorageSync(name);
    } catch {
      console.warn('Storage removeItem failed:', name);
    }
  },
};

// ============ 类型定义 ============
export interface HotelState {
  // 当前查看的酒店详情
  currentHotel: Hotel | null;
  
  // 收藏的酒店 ID 列表
  favoriteIds: number[];
  
  // 最近浏览的酒店
  recentlyViewed: Hotel[];

  // 操作方法
  setCurrentHotel: (hotel: Hotel | null) => void;
  toggleFavorite: (hotelId: number) => void;
  isFavorite: (hotelId: number) => boolean;
  addToRecentlyViewed: (hotel: Hotel) => void;
  clearRecentlyViewed: () => void;
}

// ============ Store ============
export const useHotelStore = create<HotelState>()(
  persist(
    (set, get) => ({
      currentHotel: null,
      favoriteIds: [],
      recentlyViewed: [],

      setCurrentHotel: (hotel) => set({ currentHotel: hotel }),

      toggleFavorite: (hotelId) =>
        set((state) => {
          const isFav = state.favoriteIds.includes(hotelId);
          return {
            favoriteIds: isFav
              ? state.favoriteIds.filter((id) => id !== hotelId)
              : [...state.favoriteIds, hotelId],
          };
        }),

      isFavorite: (hotelId) => get().favoriteIds.includes(hotelId),

      addToRecentlyViewed: (hotel) =>
        set((state) => {
          // 去重，最多保留 20 条
          const filtered = state.recentlyViewed.filter((h) => h.id !== hotel.id);
          return {
            recentlyViewed: [hotel, ...filtered].slice(0, 20),
          };
        }),

      clearRecentlyViewed: () => set({ recentlyViewed: [] }),
    }),
    {
      name: 'hotel-store',
      storage: createJSONStorage(() => taroStorage),
      partialize: (state) => ({
        favoriteIds: state.favoriteIds,
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);
