/**
 * useHotels hooks 测试
 */
import { describe, it, expect } from 'vitest';
import { flattenHotelPages, getTotalFromPages, hotelKeys } from './useHotels';
import type { HotelListResponse } from '../types/hotel';

describe('hotelKeys', () => {
    it('should generate correct query keys for list', () => {
        const params = { city: '上海', keyword: 'test' };
        const key = hotelKeys.list(params);
        expect(key).toEqual(['hotels', 'list', params]);
    });

    it('should generate correct query keys for detail', () => {
        const key = hotelKeys.detail(123);
        expect(key).toEqual(['hotels', 'detail', 123]);
    });

    it('should generate correct base keys', () => {
        expect(hotelKeys.all).toEqual(['hotels']);
        expect(hotelKeys.lists()).toEqual(['hotels', 'list']);
        expect(hotelKeys.details()).toEqual(['hotels', 'detail']);
    });
});

describe('flattenHotelPages', () => {
    it('should flatten multiple pages of hotels', () => {
        const data = {
            pages: [
                { data: [{ id: 1, nameCn: 'Hotel 1', address: 'Addr 1', starRating: 4 }], page: 1, pageSize: 10, total: 20, totalPages: 2 },
                { data: [{ id: 2, nameCn: 'Hotel 2', address: 'Addr 2', starRating: 5 }], page: 2, pageSize: 10, total: 20, totalPages: 2 },
            ] as HotelListResponse[],
        };

        const result = flattenHotelPages(data);
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe(1);
        expect(result[1].id).toBe(2);
    });

    it('should return empty array for undefined data', () => {
        expect(flattenHotelPages(undefined)).toEqual([]);
    });

    it('should return empty array for empty pages', () => {
        expect(flattenHotelPages({ pages: [] })).toEqual([]);
    });

    it('should handle pages with no data', () => {
        const data = {
            pages: [
                { data: [], page: 1, pageSize: 10, total: 0, totalPages: 0 },
            ] as HotelListResponse[],
        };
        expect(flattenHotelPages(data)).toEqual([]);
    });
});

describe('getTotalFromPages', () => {
    it('should return total from first page', () => {
        const data = {
            pages: [
                { data: [], page: 1, pageSize: 10, total: 42, totalPages: 5 },
            ] as HotelListResponse[],
        };

        expect(getTotalFromPages(data)).toBe(42);
    });

    it('should return 0 for undefined data', () => {
        expect(getTotalFromPages(undefined)).toBe(0);
    });

    it('should return 0 for empty pages', () => {
        expect(getTotalFromPages({ pages: [] })).toBe(0);
    });
});
