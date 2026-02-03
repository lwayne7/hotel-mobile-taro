import type { Hotel } from '../types/hotel';

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

