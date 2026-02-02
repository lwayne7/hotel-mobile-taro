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
        data: [{ id: 1, nameCn: 'Test Hotel' }],
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
          url: '/api/public/hotels',
          data: expect.objectContaining({
            page: 1,
            pageSize: 10,
            city: '上海',
          }),
        })
      );
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

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/public/hotels',
        data: {},
      });
    });

    it('should filter params with keyword', async () => {
      mockRequest.mockResolvedValueOnce({ data: [] });

      await publicHotelApi.getList({
        keyword: '外滩',
        starRating: 5,
        minPrice: 500,
        maxPrice: 1000,
      });

      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/public/hotels',
          data: expect.objectContaining({
            keyword: '外滩',
            starRating: 5,
            minPrice: 500,
            maxPrice: 1000,
          }),
        })
      );
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
      expect(mockRequest).toHaveBeenCalledWith({
        url: '/api/public/hotels/1',
      });
    });
  });
});
