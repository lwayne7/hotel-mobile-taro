import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearchStore } from './useSearchStore';
import dayjs from 'dayjs';

describe('useSearchStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useSearchStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have default city as 上海', () => {
      const { result } = renderHook(() => useSearchStore());
      expect(result.current.city).toBe('上海');
    });

    it('should have empty keyword', () => {
      const { result } = renderHook(() => useSearchStore());
      expect(result.current.keyword).toBe('');
    });

    it('should have today as checkIn', () => {
      const { result } = renderHook(() => useSearchStore());
      expect(result.current.checkIn).toBe(dayjs().format('YYYY-MM-DD'));
    });

    it('should have tomorrow as checkOut', () => {
      const { result } = renderHook(() => useSearchStore());
      expect(result.current.checkOut).toBe(dayjs().add(1, 'day').format('YYYY-MM-DD'));
    });
  });

  describe('setCity', () => {
    it('should update city', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setCity('北京');
      });

      expect(result.current.city).toBe('北京');
    });
  });

  describe('setKeyword', () => {
    it('should update keyword', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setKeyword('外滩');
      });

      expect(result.current.keyword).toBe('外滩');
    });
  });

  describe('setDateRange', () => {
    it('should update checkIn and checkOut', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setDateRange('2026-03-01', '2026-03-03');
      });

      expect(result.current.checkIn).toBe('2026-03-01');
      expect(result.current.checkOut).toBe('2026-03-03');
    });
  });

  describe('setStarRating', () => {
    it('should update starRating', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setStarRating(5);
      });

      expect(result.current.starRating).toBe(5);
    });
  });

  describe('setPriceRange', () => {
    it('should update priceRange string', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setPriceRange('¥150-300');
      });

      expect(result.current.priceRange).toBe('¥150-300');
    });
  });

  describe('setPriceRangeValues', () => {
    it('should update minPrice and maxPrice', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setPriceRangeValues(200, 800);
      });

      expect(result.current.minPrice).toBe(200);
      expect(result.current.maxPrice).toBe(800);
    });
  });

  describe('reset', () => {
    it('should reset to default state', () => {
      const { result } = renderHook(() => useSearchStore());

      act(() => {
        result.current.setCity('北京');
        result.current.setKeyword('test');
        result.current.setStarRating(5);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.city).toBe('上海');
      expect(result.current.keyword).toBe('');
      expect(result.current.starRating).toBe(0);
    });
  });
});
