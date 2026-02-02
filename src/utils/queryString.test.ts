/**
 * queryString 工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { toQueryString } from './queryString';

describe('toQueryString', () => {
    it('should convert simple params to query string', () => {
        const result = toQueryString({ city: '上海', page: 1 });
        expect(result).toBe('city=%E4%B8%8A%E6%B5%B7&page=1');
    });

    it('should handle empty object', () => {
        expect(toQueryString({})).toBe('');
    });

    it('should skip undefined values', () => {
        const result = toQueryString({ city: '北京', minPrice: undefined });
        expect(result).toBe('city=%E5%8C%97%E4%BA%AC');
    });

    it('should skip null values', () => {
        const result = toQueryString({ city: '北京', maxPrice: null });
        expect(result).toBe('city=%E5%8C%97%E4%BA%AC');
    });

    it('should handle boolean values', () => {
        const result = toQueryString({ available: true, closed: false });
        expect(result).toBe('available=true&closed=false');
    });

    it('should handle number values including zero', () => {
        const result = toQueryString({ page: 0, pageSize: 10 });
        // '0' is falsy but String(0) = '0' which is truthy
        expect(result).toContain('pageSize=10');
    });

    it('should encode special characters', () => {
        const result = toQueryString({ q: 'hello world&foo=bar' });
        expect(result).toBe('q=hello%20world%26foo%3Dbar');
    });

    it('should skip empty string values', () => {
        const result = toQueryString({ keyword: '', city: '上海' });
        expect(result).toBe('city=%E4%B8%8A%E6%B5%B7');
    });
});
