import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publicHotelApi } from './api';
import { request } from './request';

// Mock request
vi.mock('./request', () => ({
  request: vi.fn(),
}));

const mockRequest = vi.mocked(request);

describe('publicHotelApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getList', () => {
    it('should call request with correct params', async () => {
      const mockResponse = {
        data: [{ id: 1, nameCn: 'Test Hotel', address: '上海市测试路 1 号', starRating: 5 }],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      const result = await publicHotelApi.getList({
        page: 1,
        pageSize: 10,
        city: '上海',
      });

      expect(result).toEqual(mockResponse);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringMatching(/^\/api\/public\/hotels\?/),
        })
      );
      const callUrl = mockRequest.mock.calls[0][0].url;
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('pageSize=10');
      expect(callUrl).toContain('city=');
    });

    it('should handle empty params', async () => {
      const mockResponse = {
        data: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      await publicHotelApi.getList();

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: '/api/v1/public/hotels',
        })
      );
    });

    it('should filter params with keyword', async () => {
      const mockResponse = {
        data: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
      };
      mockRequest.mockResolvedValueOnce(mockResponse);

      await publicHotelApi.getList({
        keyword: '外滩',
        starRating: 5,
        minPrice: 500,
        maxPrice: 1000,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'GET',
          url: expect.stringMatching(/^\/api\/public\/hotels\?/),
        })
      );
      const callUrl = mockRequest.mock.calls[0][0].url;
      expect(callUrl).toContain('keyword=');
      expect(callUrl).toContain('starRating=5');
      expect(callUrl).toContain('minPrice=500');
      expect(callUrl).toContain('maxPrice=1000');
    });
  });

  describe('getById', () => {
    it('should call request with hotel id', async () => {
      const mockHotel = {
        id: 1,
        nameCn: 'Test Hotel',
        address: 'Test Address',
        starRating: 5,
      };
      mockRequest.mockResolvedValueOnce(mockHotel);

      const result = await publicHotelApi.getById(1);

      expect(result).toEqual(mockHotel);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/v1/public/hotels/1', method: 'GET' })
      );
    });
  });
});
