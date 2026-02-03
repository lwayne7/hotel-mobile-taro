import { describe, it, expect } from 'vitest';
import type { Hotel } from '../types/hotel';
import {
  getMinPrice,
  getOriginalPrice,
  getDisplayTags,
  getDiscountLabel,
  getSimulatedScore,
} from './hotel';

const baseHotel: Hotel = {
  id: 1,
  nameCn: '测试酒店',
  address: '测试地址',
  starRating: 5,
};

describe('utils/hotel', () => {
  it('getMinPrice 返回最小房价，忽略非数字', () => {
    const hotel: Hotel = {
      ...baseHotel,
      roomTypes: [
        { price: 300 },
        { price: 200 },
        { price: 500 },
        { price: NaN as any },
      ],
    };
    expect(getMinPrice(hotel)).toBe(200);
  });

  it('getMinPrice 在没有房型时返回 0', () => {
    expect(getMinPrice(baseHotel)).toBe(0);
  });

  it('getOriginalPrice 返回最小的原价且大于 0', () => {
    const hotel: Hotel = {
      ...baseHotel,
      roomTypes: [
        { originalPrice: 800 },
        { originalPrice: 600 },
        { originalPrice: 0 },
      ],
    };
    expect(getOriginalPrice(hotel)).toBe(600);
  });

  it('getDisplayTags 优先使用酒店设施，不足时使用默认标签', () => {
    const hotelWithFacilities: Hotel = {
      ...baseHotel,
      facilities: ['泳池', '健身房', '早餐', '停车场'],
    };
    expect(getDisplayTags(hotelWithFacilities)).toEqual(['泳池', '健身房', '早餐']);

    const hotelWithoutFacilities: Hotel = baseHotel;
    expect(getDisplayTags(hotelWithoutFacilities)).toEqual(['免费WiFi', '免费停车']);
  });

  it('getDiscountLabel 根据折扣类型生成正确标签', () => {
    const percentageHotel: Hotel = {
      ...baseHotel,
      roomTypes: [{ price: 200, originalPrice: 400, discountType: 'percentage' }],
    };
    expect(getDiscountLabel(percentageHotel)).toBe('50%OFF');

    const fixedHotel: Hotel = {
      ...baseHotel,
      roomTypes: [{ price: 300, originalPrice: 500, discountType: 'fixed' }],
    };
    expect(getDiscountLabel(fixedHotel)).toBe('减¥200');

    const packageHotel: Hotel = {
      ...baseHotel,
      roomTypes: [{ price: 300, originalPrice: 300, discountType: 'package' }],
    };
    expect(getDiscountLabel(packageHotel)).toBe('套餐优惠');

    const noDiscountHotel: Hotel = {
      ...baseHotel,
      roomTypes: [{ price: 300, originalPrice: 300, discountType: 'none' }],
    };
    expect(getDiscountLabel(noDiscountHotel)).toBeNull();
  });

  it('getSimulatedScore 始终返回 0-5 之间的一位小数', () => {
    const score = getSimulatedScore(baseHotel);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(5);
    // 一位小数
    expect(Number(score.toFixed(1))).toBe(score);
  });
});

