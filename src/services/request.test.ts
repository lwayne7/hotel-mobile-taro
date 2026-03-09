import { describe, it, expect, vi, beforeEach } from 'vitest';
import Taro from '@tarojs/taro';
import { request, http, addInterceptor } from './request';

// Mock Taro.request
const mockTaroRequest = vi.mocked(Taro.request);

describe('request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('request function', () => {
    it('should make a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test Hotel' };
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: mockData,
      } as any);

      const result = await request({ url: '/api/hotels/1' });

      expect(result).toEqual(mockData);
      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('/api/hotels/1'),
          method: 'GET',
        })
      );
    });

    it('should parse JSON string response', async () => {
      const jsonString = JSON.stringify({ data: [{ id: 1 }], page: 1, pageSize: 10, total: 1, totalPages: 1 });
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: jsonString,
      } as any);

      const result = await request({ url: '/api/v1/public/hotels?page=1' });

      expect(result).toEqual(JSON.parse(jsonString));
    });

    it('should throw on non-JSON string response', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: '<html>not json</html>',
      } as any);

      await expect(request({ url: '/api/v1/public/hotels' })).rejects.toThrow('接口返回非 JSON');
    });

    it('should make a POST request with data', async () => {
      const postData = { name: 'New Hotel' };
      const mockResponse = { id: 1, ...postData };
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 201,
        data: mockResponse,
      } as any);

      const result = await request({
        url: '/api/hotels',
        method: 'POST',
        data: postData,
      });

      expect(result).toEqual(mockResponse);
      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: postData,
        })
      );
    });

    it('should throw error on HTTP error response', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 404,
        data: { message: 'Not found' },
      } as any);

      await expect(request({ url: '/api/hotels/999' })).rejects.toThrow();
    });

    it('should handle array error messages', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 400,
        data: { message: ['Error 1', 'Error 2'] },
      } as any);

      await expect(request({ url: '/api/test' })).rejects.toThrow();
    });
  });

  describe('http convenience methods', () => {
    it('http.get should call request with GET method', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: { data: [] },
      } as any);

      await http.get('/api/hotels');

      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('http.post should call request with POST method', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: { success: true },
      } as any);

      await http.post('/api/hotels', { name: 'Test' });

      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          data: { name: 'Test' },
        })
      );
    });

    it('http.put should call request with PUT method', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: { success: true },
      } as any);

      await http.put('/api/hotels/1', { name: 'Updated' });

      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PUT',
          data: { name: 'Updated' },
        })
      );
    });

    it('http.delete should call request with DELETE method', async () => {
      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: { success: true },
      } as any);

      await http.delete('/api/hotels/1');

      expect(mockTaroRequest).toHaveBeenCalledWith(
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('interceptors', () => {
    it('should add and remove interceptor', () => {
      const interceptor = {
        onRequest: vi.fn((opts) => opts),
      };

      const remove = addInterceptor(interceptor);
      expect(typeof remove).toBe('function');

      remove();
      // Interceptor should be removed
    });

    it('should execute request interceptor', async () => {
      const onRequest = vi.fn((opts) => ({
        ...opts,
        header: { ...opts.header, 'X-Custom': 'test' },
      }));

      const remove = addInterceptor({ onRequest });

      mockTaroRequest.mockResolvedValueOnce({
        statusCode: 200,
        data: {},
      } as any);

      await request({ url: '/api/test' });

      expect(onRequest).toHaveBeenCalled();

      remove();
    });
  });
});
