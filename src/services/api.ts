import { request } from './request';
import type { Hotel, HotelListResponse } from '../types/hotel';
import type { Order, PageResponse } from '../types/order';
import { toQueryString } from '../utils/queryString';
import { HotelSchema, HotelListResponseSchema } from '../schemas/hotel';

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

// ============ 轻量运行时校验 ============

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

const DETAILED_VALIDATION_ENABLED =
  process.env.NODE_ENV !== 'production' && process.env.TARO_ENV !== 'weapp';

// ============ Zod 结构校验（仅开发态，替代手写 validate* 函数） ============

/** 将 Zod error 格式化为可读的校验摘要 */
function formatZodError(error: { issues: ReadonlyArray<{ path: readonly PropertyKey[]; message: string }> }): string {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${[...issue.path].join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

/** 生产环境下的最小校验并补全分页字段，避免在运行时引入过重依赖。 */
function minimalValidateList(normalized: unknown): HotelListResponse {
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

/** 生产环境下酒店详情的最小校验。 */
function minimalValidateHotel(normalized: unknown): Hotel {
  if (!normalized || typeof normalized !== 'object') throw new Error('响应数据格式错误：不是对象');
  const o = normalized as Record<string, unknown>;
  if (typeof o.id !== 'number') throw new Error('响应数据格式错误：id 不是数字');
  if (typeof o.nameCn !== 'string') throw new Error('响应数据格式错误：nameCn 不是字符串');
  return normalized as Hotel;
}

/** 统一解析：生产态走最小校验，开发态走 Zod 结构校验。 */
function parseHotelListResponse(res: unknown): HotelListResponse {
  const normalized = normalizeResponseData(res);
  if (!DETAILED_VALIDATION_ENABLED) return minimalValidateList(normalized);

  const result = HotelListResponseSchema.safeParse(normalized);
  if (result.success) return normalized as HotelListResponse;

  const issueText = formatZodError(result.error);
  if (process.env.NODE_ENV !== 'production') {
    console.error('[parseHotelListResponse] Zod 校验失败:', { error: result.error, response: res });
  }
  throw new Error(`酒店列表接口返回异常，请检查小程序 API_BASE 配置/是否命中正确后端。响应：${previewResponse(res)}；校验错误：${issueText}`);
}

function parseHotel(res: unknown): Hotel {
  const normalized = normalizeResponseData(res);
  if (!DETAILED_VALIDATION_ENABLED) return minimalValidateHotel(normalized);

  const result = HotelSchema.safeParse(normalized);
  if (result.success) return normalized as Hotel;

  const issueText = formatZodError(result.error);
  throw new Error(`酒店详情接口返回异常，响应：${previewResponse(res)}；校验错误：${issueText}`);
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
    return request<unknown>({ url: `/api/v1/public/hotels${qs ? `?${qs}` : ''}`, method: 'GET' }).then(parseHotelListResponse);
  },
  getById: (id: number): Promise<Hotel> =>
    request<unknown>({ url: `/api/v1/public/hotels/${id}`, method: 'GET' }).then(parseHotel),
};

// ============ Auth / Orders / Payments（最小闭环演示） ============

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: { id: number; username: string; role: string };
}

export const authApi = {
  login: (data: LoginParams): Promise<LoginResponse> =>
    request<LoginResponse>({ url: '/api/v1/auth/login', method: 'POST', data, skipAuth: true }),
  profile: (): Promise<{ id: number; username: string; role: string } | null> =>
    request<any>({ url: '/api/v1/auth/profile', method: 'GET' }).catch(() => null),
};

export interface CreateOrderParams {
  hotelId: number;
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  rooms: number;
  guests: number;
}

export const orderApi = {
  create: (data: CreateOrderParams): Promise<Order> =>
    request<Order>({ url: '/api/v1/orders', method: 'POST', data }),
  mine: (params?: { page?: number; pageSize?: number }): Promise<PageResponse<Order>> => {
    const qs = toQueryString({ page: params?.page, pageSize: params?.pageSize });
    return request<PageResponse<Order>>({ url: `/api/v1/orders/mine${qs ? `?${qs}` : ''}`, method: 'GET' });
  },
  cancel: (id: number): Promise<Order> =>
    request<Order>({ url: `/api/v1/orders/${id}/cancel`, method: 'POST' }),
  remove: (id: number): Promise<void> =>
    request<void>({ url: `/api/v1/orders/${id}`, method: 'DELETE' }),
};

export interface PaymentCallbackParams {
  eventId: string;
  orderId: number;
  paymentNo?: string;
  paidAt?: string;
}

export const paymentApi = {
  callback: (data: PaymentCallbackParams) =>
    request<any>({ url: '/api/v1/payments/callback', method: 'POST', data, skipAuth: true }),
};
