import { request } from './request';
import type { Hotel, HotelListResponse } from '../types/hotel';

function previewResponse(data: unknown): string {
  try {
    const text = JSON.stringify(data);
    return text.length > 200 ? `${text.slice(0, 200)}...` : text;
  } catch {
    return String(data);
  }
}

function assertHotelListResponse(res: any): asserts res is HotelListResponse {
  if (!res || !Array.isArray(res.data)) {
    throw new Error(`酒店列表接口返回异常，请检查小程序 API_BASE 配置/是否命中正确后端。响应：${previewResponse(res)}`);
  }
}

export const publicHotelApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
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
  }): Promise<HotelListResponse> => {
    const data: Record<string, any> = {};
    if (params?.page != null) data.page = params.page;
    if (params?.pageSize != null) data.pageSize = params.pageSize;
    if (params?.keyword) data.keyword = params.keyword;
    if (params?.city) data.city = params.city;
    if (params?.starRating != null && params.starRating > 0) data.starRating = params.starRating;
    if (params?.minPrice != null) data.minPrice = params.minPrice;
    if (params?.maxPrice != null) data.maxPrice = params.maxPrice;
    if (params?.sortBy) data.sortBy = params.sortBy;
    // 综合筛选参数
    if (params?.facilities) data.facilities = params.facilities;
    if (params?.brands) data.brands = params.brands;
    if (params?.hotelFeatures) data.hotelFeatures = params.hotelFeatures;
    if (params?.roomFeatures) data.roomFeatures = params.roomFeatures;

    return request<any>({ url: '/api/public/hotels', data }).then((res) => {
      assertHotelListResponse(res);
      return res;
    });
  },
  getById: (id: number): Promise<Hotel> =>
    request<Hotel>({ url: `/api/public/hotels/${id}` }),
};
