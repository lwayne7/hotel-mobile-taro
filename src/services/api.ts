import { request } from './request';
import type { Hotel, HotelListResponse } from '../types/hotel';
import { toQueryString } from '../utils/queryString';
import { z } from 'zod';

/** 列表请求参数（与后端 public/hotels 查询参数一致） */
export interface HotelListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  city?: string;
  starRating?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  accommodationType?: string;
  facilities?: string;
  brands?: string;
  hotelFeatures?: string;
  roomFeatures?: string;
  tags?: string;
}

function previewResponse(data: unknown): string {
  try {
    const text = JSON.stringify(data);
    return text.length > 200 ? `${text.slice(0, 200)}...` : text;
  } catch {
    return String(data);
  }
}

// ============ Zod 运行时校验 ============

function normalizeNumberLike(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const num = Number(trimmed);
    return Number.isFinite(num) ? num : undefined;
  }
  return undefined;
}

function normalizeStringLike(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return undefined;
}

// 数字字段及 null 时的默认值（避免小程序 z.preprocess/.default 兼容问题）
const NUMERIC_KEYS = new Set([
  'id', 'price', 'originalPrice', 'discountValue', 'roomSize', 'maxGuests',
  'starRating', 'page', 'pageSize', 'total', 'totalPages',
]);
const NUMERIC_DEFAULTS: Record<string, number> = {
  starRating: 0, page: 1, pageSize: 10, total: 0, totalPages: 0,
};
const STRING_KEYS = new Set([
  'name', 'nameCn', 'nameEn', 'address', 'description', 'bedType',
  'floors', 'imageUrl', 'discountDescription', 'discountType',
]);
const STRING_DEFAULTS: Record<string, string> = { nameCn: '', address: '' };

function normalizeResponseData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(normalizeResponseData);

  const normalized: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      normalized[key] = NUMERIC_DEFAULTS[key] ?? STRING_DEFAULTS[key] ?? value;
      continue;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      normalized[key] = normalizeResponseData(value);
      continue;
    }
    if (Array.isArray(value)) {
      normalized[key] = value.map(normalizeResponseData);
      continue;
    }
    if (NUMERIC_KEYS.has(key)) {
      const num = normalizeNumberLike(value);
      normalized[key] = num ?? NUMERIC_DEFAULTS[key];
      continue;
    }
    if (STRING_KEYS.has(key)) {
      const str = normalizeStringLike(value);
      normalized[key] = str ?? STRING_DEFAULTS[key];
      continue;
    }
    if (key === 'amenities') {
      normalized[key] = Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
      continue;
    }
    normalized[key] = value;
  }
  return normalized;
}

// 简化 schema，避免使用 z.preprocess（小程序环境兼容性问题）
// 使用 .nullish() 同时支持 null 和 undefined
const roomTypeSchema = z
  .object({
    id: z.number().nullish(),
    name: z.string().nullish(),
    price: z.number().nullish(),
    originalPrice: z.number().nullish(),
    discountType: z.string().nullish(),
    discountValue: z.number().nullish(),
    discountDescription: z.string().nullish(),
    bedType: z.string().nullish(),
    roomSize: z.number().nullish(),
    maxGuests: z.number().nullish(),
    floors: z.string().nullish(),
    imageUrl: z.string().nullish(),
    amenities: z.array(z.string()).nullish(),
  })
  .passthrough();

const hotelImageSchema = z
  .object({
    id: z.number().nullish(),
    imageUrl: z.string().nullish(),
    description: z.string().nullish(),
  })
  .passthrough();

// 运行时校验要求最核心字段（id/nameCn/address/starRating），保证 UI 必需字段存在；
// 其他字段保持透传（passthrough），避免因为后端返回 null/额外字段导致误报。
// 注意：不使用 .default() 避免小程序环境兼容性问题，默认值在 normalizeResponseData 中处理
const hotelSchema = z
  .object({
    id: z.number(),
    nameCn: z.string(),
    address: z.string(),
    starRating: z.number(),
    roomTypes: z.array(roomTypeSchema).optional(),
    images: z.array(hotelImageSchema).optional(),
  })
  .passthrough();

const hotelListResponseSchema = z
  .object({
    data: z.array(hotelSchema),
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  })
  .passthrough();

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

/** 小程序环境下列表响应的最小校验并补全分页字段 */
function weappValidateList(normalized: unknown): HotelListResponse {
  if (!normalized || typeof normalized !== 'object') throw new Error('响应数据格式错误：不是对象');
  const o = normalized as Record<string, unknown>;
  if (!Array.isArray(o.data)) throw new Error('响应数据格式错误：data 不是数组');
  return {
    data: o.data as Hotel[],
    page: typeof o.page === 'number' ? o.page : 1,
    pageSize: typeof o.pageSize === 'number' ? o.pageSize : 10,
    total: typeof o.total === 'number' ? o.total : 0,
    totalPages: typeof o.totalPages === 'number' ? o.totalPages : 0,
  };
}

/** 小程序环境下酒店详情的最大校验 */
function weappValidateHotel(normalized: unknown): Hotel {
  if (!normalized || typeof normalized !== 'object') throw new Error('响应数据格式错误：不是对象');
  const o = normalized as Record<string, unknown>;
  if (typeof o.id !== 'number') throw new Error('响应数据格式错误：id 不是数字');
  if (typeof o.nameCn !== 'string') throw new Error('响应数据格式错误：nameCn 不是字符串');
  return normalized as Hotel;
}

/** 统一解析：先 normalize，再按环境走 weapp 校验或 Zod（schema 输出类型与 T 兼容即可） */
function parseResponse<T>(
  res: unknown,
  weappValidate: (n: unknown) => T,
  zodSchema: z.ZodType<unknown>,
  errorPrefix: string,
  logLabel?: string
): T {
  const normalized = normalizeResponseData(res);
  try {
    if (process.env.TARO_ENV === 'weapp') {
      return weappValidate(normalized);
    }
    const parsed = zodSchema.safeParse(normalized);
    if (parsed.success) return parsed.data as T;
    throw parsed.error;
  } catch (err) {
    const issueText = err instanceof z.ZodError ? `；校验错误：${formatZodIssues(err)}` : '';
    if (process.env.NODE_ENV !== 'production' && logLabel) {
      console.error(`[${logLabel}] 校验失败:`, {
        error: err,
        response: res,
        zodIssues: err instanceof z.ZodError ? err.issues : undefined,
      });
    }
    throw new Error(`${errorPrefix}${previewResponse(res)}${issueText}`);
  }
}

function parseHotelListResponse(res: unknown): HotelListResponse {
  return parseResponse<HotelListResponse>(
    res,
    weappValidateList,
    hotelListResponseSchema,
    '酒店列表接口返回异常，请检查小程序 API_BASE 配置/是否命中正确后端。响应：',
    'parseHotelListResponse'
  );
}

function parseHotel(res: unknown): Hotel {
  return parseResponse<Hotel>(res, weappValidateHotel, hotelSchema, '酒店详情接口返回异常，响应：');
}

function buildListQuery(params?: HotelListParams): Record<string, string | number | undefined> {
  if (!params) return {};
  return {
    page: params.page,
    pageSize: params.pageSize,
    keyword: params.keyword?.trim() || undefined,
    city: params.city?.trim() || undefined,
    starRating: params.starRating != null && params.starRating > 0 ? params.starRating : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    sortBy: params.sortBy,
    accommodationType: params.accommodationType,
    facilities: params.facilities,
    brands: params.brands,
    hotelFeatures: params.hotelFeatures,
    roomFeatures: params.roomFeatures,
    tags: params.tags,
  };
}

export const publicHotelApi = {
  getList: (params?: HotelListParams): Promise<HotelListResponse> => {
    const qs = toQueryString(buildListQuery(params));
    return request<unknown>({ url: `/api/public/hotels${qs ? `?${qs}` : ''}`, method: 'GET' }).then(parseHotelListResponse);
  },
  getById: (id: number): Promise<Hotel> =>
    request<unknown>({ url: `/api/public/hotels/${id}`, method: 'GET' }).then(parseHotel),
};
