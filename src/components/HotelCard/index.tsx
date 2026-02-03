/**
 * HotelCard - 酒店卡片组件
 * 三端统一实现，使用 Taro 基础组件
 */
import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { Hotel } from '../../types/hotel';
import { rnShadow, platform } from '../../styles/rn-utils';
import './index.scss';

export interface HotelCardProps {
  hotel: Hotel;
  checkIn?: string;
  checkOut?: string;
  onClick?: (hotel: Hotel) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function HotelCard({
  hotel,
  onClick,
  className = '',
  style,
}: HotelCardProps) {
  // 计算最低价
  const getMinPrice = (): number => {
    const prices = hotel.roomTypes?.map((r) => Number(r?.price)).filter((n) => !isNaN(n)) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

  // 计算原价
  const getOriginalPrice = (): number => {
    const prices = hotel.roomTypes?.map((r) => Number(r?.originalPrice)).filter((n) => !isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

  // 获取标签
  const getTags = (): string[] => {
    const tags: string[] = [];
    if (hotel.facilities?.length) tags.push(...hotel.facilities.slice(0, 3));
    if (tags.length === 0) tags.push('免费WiFi', '免费停车');
    return tags.slice(0, 3);
  };

  // 获取折扣标签
  const getDiscountLabel = (): string | null => {
    const room = hotel.roomTypes?.find((r: any) => r.discountType && r.discountType !== 'none');
    if (!room) return null;

    const discountType = room.discountType;
    const originalPrice = Number(room.originalPrice);
    const price = Number(room.price);

    if (discountType === 'percentage' && originalPrice > price) {
      const discount = Math.round((1 - price / originalPrice) * 100);
      return `${discount}%OFF`;
    } else if (discountType === 'fixed' && originalPrice > price) {
      return `减¥${Math.round(originalPrice - price)}`;
    } else if (discountType === 'package') {
      return '套餐优惠';
    }
    return null;
  };

  // 模拟评分
  const getScore = (): number => {
    const s = (hotel.id % 31) / 10 + 4.3;
    return Math.min(5, Math.round(s * 10) / 10);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(hotel);
    }
  };

  const minPrice = getMinPrice();
  const originalPrice = getOriginalPrice();
  const tags = getTags();
  const score = getScore();
  const discountLabel = getDiscountLabel();
  const image = hotel.images?.[0]?.imageUrl || '';

  const cardStyle: React.CSSProperties = {
    ...style,
    ...(platform.isRN ? rnShadow(4) : {}),
  };

  return (
    <View className={`hotel-card ${className}`} style={cardStyle} onClick={handleClick}>
      <View className="hotel-card-image-wrap">
        {image ? (
          <Image src={image} mode="aspectFill" lazyLoad className="hotel-card-image" />
        ) : (
          <View className="hotel-card-image-placeholder">
            <Text className="hotel-card-image-placeholder-text">暂无图片</Text>
          </View>
        )}
        {discountLabel && (
          <View className="hotel-card-discount-badge">
            <Text className="hotel-card-discount-text">{discountLabel}</Text>
          </View>
        )}
      </View>
      <View className="hotel-card-info">
        <View className="hotel-card-header">
          <Text className="hotel-card-name" numberOfLines={1}>
            {hotel.nameCn}
          </Text>
          <Text className="hotel-card-star">{'★'.repeat(hotel.starRating)}</Text>
        </View>
        <Text className="hotel-card-address" numberOfLines={1}>
          {hotel.address}
        </Text>
        <View className="hotel-card-tags">
          {tags.map((tag, index) => (
            <Text key={index} className="hotel-card-tag">
              {tag}
            </Text>
          ))}
        </View>
        <View className="hotel-card-footer">
          <View className="hotel-card-rating">
            <Text className="hotel-card-score">{score}</Text>
            <Text className="hotel-card-score-label">
              {score >= 4.8 ? '超棒' : score >= 4.5 ? '很棒' : '不错'}
            </Text>
          </View>
          <View className="hotel-card-price">
            <View className="hotel-card-price-row">
              {originalPrice > minPrice && (
                <Text className="hotel-card-original-price">¥{originalPrice}</Text>
              )}
              <Text className="hotel-card-current-price">¥{minPrice}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
