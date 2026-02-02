import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHotelStore } from './useHotelStore';
import type { Hotel } from '../types/hotel';

const mockHotel: Hotel = {
  id: 1,
  nameCn: '测试酒店',
  address: '测试地址',
  starRating: 5,
};

const mockHotel2: Hotel = {
  id: 2,
  nameCn: '测试酒店2',
  address: '测试地址2',
  starRating: 4,
};

describe('useHotelStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useHotelStore());
    act(() => {
      result.current.setCurrentHotel(null);
      result.current.clearRecentlyViewed();
      // Clear favorites
      result.current.favoriteIds.forEach((id) => {
        result.current.toggleFavorite(id);
      });
    });
  });

  describe('currentHotel', () => {
    it('should set current hotel', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.setCurrentHotel(mockHotel);
      });

      expect(result.current.currentHotel).toEqual(mockHotel);
    });

    it('should clear current hotel', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.setCurrentHotel(mockHotel);
      });

      act(() => {
        result.current.setCurrentHotel(null);
      });

      expect(result.current.currentHotel).toBeNull();
    });
  });

  describe('favorites', () => {
    it('should add hotel to favorites', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.favoriteIds).toContain(1);
      expect(result.current.isFavorite(1)).toBe(true);
    });

    it('should remove hotel from favorites', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.toggleFavorite(1);
      });

      act(() => {
        result.current.toggleFavorite(1);
      });

      expect(result.current.favoriteIds).not.toContain(1);
      expect(result.current.isFavorite(1)).toBe(false);
    });
  });

  describe('recentlyViewed', () => {
    it('should add hotel to recently viewed', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.addToRecentlyViewed(mockHotel);
      });

      expect(result.current.recentlyViewed).toHaveLength(1);
      expect(result.current.recentlyViewed[0].id).toBe(1);
    });

    it('should not duplicate hotels', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.addToRecentlyViewed(mockHotel);
        result.current.addToRecentlyViewed(mockHotel2);
        result.current.addToRecentlyViewed(mockHotel);
      });

      expect(result.current.recentlyViewed).toHaveLength(2);
      expect(result.current.recentlyViewed[0].id).toBe(1); // Most recent first
    });

    it('should limit to 20 items', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        for (let i = 1; i <= 25; i++) {
          result.current.addToRecentlyViewed({
            id: i,
            nameCn: `酒店${i}`,
            address: '地址',
            starRating: 5,
          });
        }
      });

      expect(result.current.recentlyViewed).toHaveLength(20);
    });

    it('should clear recently viewed', () => {
      const { result } = renderHook(() => useHotelStore());

      act(() => {
        result.current.addToRecentlyViewed(mockHotel);
        result.current.addToRecentlyViewed(mockHotel2);
      });

      act(() => {
        result.current.clearRecentlyViewed();
      });

      expect(result.current.recentlyViewed).toHaveLength(0);
    });
  });
});
