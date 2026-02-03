import { request } from './request';
import type { Hotel, HotelListResponse } from '../types/hotel';
import { z } from 'zod';

function previewResponse(data: unknown): string {
  try {
    const text = JSON.stringify(data);
    return text.length > 200 ? `${text.slice(0, 200)}...` : text;
  } catch {
    return String(data);
  }
}

// ============ Zod 运行时校验 ============

const roomTypeSchema = z
  .object({
    id: z.number().optional(),
    name: z.string().optional(),
    price: z.number().optional(),
    originalPrice: z.number().optional(),
    discountType: z.enum(['none', 'percentage', 'fixed', 'package']).optional(),
    discountValue: z.number().optional(),
    discountDescription: z.string().optional(),
    bedType: z.string().optional(),
    roomSize: z.string().optional(),
    maxGuests: z.number().optional(),
    floors: z.string().optional(),
    imageUrl: z.string().optional(),
    amenities: z.array(z.string()).optional(),
  })
  .passthrough();

const hotelImageSchema = z
  .object({
    id: z.number().optional(),
    imageUrl: z.string(),
    description: z.string().optional(),
  })
  .passthrough();

// 运行时校验仅要求最小字段集合（id + nameCn），
// 其他字段完全放宽给 TypeScript 类型和调用端自行约束。
// 这样可以兼容后端返回的 null / 额外字段，避免在正常数据下误报。
const hotelSchema = z
  .object({
    id: z.number(),
    nameCn: z.string(),
  })
  .passthrough();

const hotelListResponseSchema = z
  .object({
    data: z.array(hotelSchema),
    page: z.number().default(1),
    pageSize: z.number().default(10),
    total: z.number().default(0),
    totalPages: z.number().default(0),
  })
  .passthrough();

function parseHotelListResponse(res: unknown): HotelListResponse {
  try {
    return hotelListResponseSchema.parse(res) as HotelListResponse;
  } catch (err) {
    throw new Error(
      `酒店列表接口返回异常，请检查小程序 API_BASE 配置/是否命中正确后端。响应：${previewResponse(
        res
      )}`
    );
  }
}

function parseHotel(res: unknown): Hotel {
  try {
    return hotelSchema.parse(res) as Hotel;
  } catch {
    throw new Error(`酒店详情接口返回异常，响应：${previewResponse(res)}`);
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
    tags?: string; // 热门标签
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
    if (params?.tags) data.tags = params.tags;

    return request<any>({ url: '/api/public/hotels', data }).then((res) =>
      parseHotelListResponse(res)
    );
  },
  getById: (id: number): Promise<Hotel> =>
    request<any>({ url: `/api/public/hotels/${id}` }).then((res) => parseHotel(res)),
};
