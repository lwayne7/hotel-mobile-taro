import type { Hotel } from '../types/hotel';

/**
 * 获取酒店展示用主图 URL（列表/卡片/推荐等）
 * 优先用后端显式返回的 coverImageUrl / cover_image_url，再按相册、房型取图
 * 无可用图片时返回空字符串，由 UI 层统一展示占位（避免前端「补图」导致不同酒店图片重复）
 */
export function getHotelDisplayImage(hotel: Hotel): string {
  const cover =
    hotel.coverImageUrl?.trim?.() ||
    (hotel as any).cover_image_url?.trim?.();
  if (cover) return cover;
  for (const img of hotel.images || []) {
    const url = img?.imageUrl?.trim?.();
    if (url) return url;
  }
  for (const room of hotel.roomTypes || []) {
    const url = room?.imageUrl?.trim?.();
    if (url) return url;
  }
  return '';
}

/**
 * 获取酒店详情轮播用图片列表（过滤空 URL；无图时返回空数组，由 UI 层展示占位）
 */
export function getHotelGalleryImages(
  hotel: Hotel
): { imageUrl: string; description?: string; id?: number }[] {
  const raw = (hotel.images || [])
    .map((img: any) => ({
      id: img?.id,
      description: img?.description,
      imageUrl: typeof img?.imageUrl === 'string' ? img.imageUrl.trim() : '',
    }))
    .filter((img) => img.imageUrl);
  if (raw.length > 0) return raw;
  const firstRoom = (hotel.roomTypes || []).find((r: any) => r?.imageUrl?.trim?.());
  if (firstRoom?.imageUrl?.trim?.())
    return [{ imageUrl: firstRoom.imageUrl!.trim(), description: '房型', id: 0 }];
  return [];
}

/**
 * 计算酒店最低价
 */
export function getMinPrice(hotel: Hotel): number {
  const prices =
    hotel.roomTypes?.map((r) => Number(r?.price)).filter((n) => !Number.isNaN(n)) || [];
  return prices.length ? Math.min(...prices) : 0;
}

/**
 * 计算酒店原价（用于展示划线价）
 */
export function getOriginalPrice(hotel: Hotel): number {
  const prices =
    hotel.roomTypes
      ?.map((r) => Number(r?.originalPrice))
      .filter((n) => !Number.isNaN(n) && n > 0) || [];
  return prices.length ? Math.min(...prices) : 0;
}

/**
 * 获取展示用标签
 */
export function getDisplayTags(hotel: Hotel, maxCount: number = 3): string[] {
  const tags: string[] = [];
  if (hotel.facilities?.length) {
    tags.push(...hotel.facilities.slice(0, maxCount));
  }
  if (tags.length === 0) {
    tags.push('免费WiFi', '免费停车');
  }
  return tags.slice(0, maxCount);
}

/**
 * 获取房价折扣标签
 */
export function getDiscountLabel(hotel: Hotel): string | null {
  const room = hotel.roomTypes?.find((r: any) => r.discountType && r.discountType !== 'none');
  if (!room) return null;

  const discountType = room.discountType;
  const originalPrice = Number(room.originalPrice);
  const price = Number(room.price);

  if (discountType === 'percentage' && originalPrice > price) {
    const discount = Math.round((1 - price / originalPrice) * 100);
    return `${discount}%OFF`;
  }

  if (discountType === 'fixed' && originalPrice > price) {
    return `减¥${Math.round(originalPrice - price)}`;
  }

  if (discountType === 'package') {
    return '套餐优惠';
  }

  return null;
}

/**
 * 模拟评分
 * TODO: 后端有真实评分后可以替换
 */
export function getSimulatedScore(hotel: Hotel): number {
  const s = (hotel.id % 31) / 10 + 4.3;
  return Math.min(5, Math.round(s * 10) / 10);
}
