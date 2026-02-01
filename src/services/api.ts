import { request } from './request';
import type { Hotel, HotelListResponse } from '../types/hotel';

export const publicHotelApi = {
  getList: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    city?: string;
    starRating?: number;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<HotelListResponse> => {
    const query = new URLSearchParams();
    if (params?.page != null) query.set('page', String(params.page));
    if (params?.pageSize != null) query.set('pageSize', String(params.pageSize));
    if (params?.keyword) query.set('keyword', params.keyword);
    if (params?.city) query.set('city', params.city);
    if (params?.starRating != null && params.starRating > 0) query.set('starRating', String(params.starRating));
    if (params?.minPrice != null) query.set('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
    const q = query.toString();
    return request<HotelListResponse>({ url: `/api/public/hotels${q ? `?${q}` : ''}` });
  },
  getById: (id: number): Promise<Hotel> =>
    request<Hotel>({ url: `/api/public/hotels/${id}` }),
};
