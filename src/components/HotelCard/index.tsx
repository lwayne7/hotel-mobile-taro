/**
 * HotelCard - 酒店卡片组件
 * 三端统一实现，使用 Taro 基础组件；图片加载失败时显示占位
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';
import type { Hotel } from '../../types/hotel';
import { rnShadow, platform } from '../../styles/rn-utils';
import {
  getMinPrice,
  getOriginalPrice,
  getDisplayTags,
  getDiscountLabel,
  getSimulatedScore,
  getHotelDisplayImage,
  DEFAULT_HOTEL_IMAGE_URL,
} from '../../utils/hotel';
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
  const [imageError, setImageError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const handleClick = () => {
    if (onClick) {
      onClick(hotel);
    }
  };
  const onImageError = useCallback(() => setImageError(true), []);
  const onFallbackError = useCallback(() => setFallbackError(true), []);

  const minPrice = getMinPrice(hotel);
  const originalPrice = getOriginalPrice(hotel);
  const tags = getDisplayTags(hotel);
  const score = getSimulatedScore(hotel);
  const discountLabel = getDiscountLabel(hotel);
  const image = getHotelDisplayImage(hotel);
  const fallbackUrl = DEFAULT_HOTEL_IMAGE_URL && image !== DEFAULT_HOTEL_IMAGE_URL ? DEFAULT_HOTEL_IMAGE_URL : '';
  const useFallback = imageError && fallbackUrl;
  const displaySrc = useFallback ? fallbackUrl : image;
  const showPlaceholder =
    !displaySrc || (imageError && (!fallbackUrl || fallbackError || image === DEFAULT_HOTEL_IMAGE_URL));

  const cardStyle: React.CSSProperties = {
    ...style,
    ...(platform.isRN ? rnShadow(4) : {}),
  };

  return (
    <View className={`hotel-card ${className}`} style={cardStyle} onClick={handleClick}>
      <View className="hotel-card-image-wrap">
        {showPlaceholder ? (
          <View className="hotel-card-image-placeholder">
            <Text className="hotel-card-image-placeholder-text">暂无图片</Text>
          </View>
        ) : (
          <Image
            src={displaySrc}
            mode="aspectFill"
            lazyLoad
            className="hotel-card-image"
            onError={useFallback ? onFallbackError : onImageError}
          />
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
