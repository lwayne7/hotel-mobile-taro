import React, { useEffect, useState } from 'react';
import { View, Text, Swiper, SwiperItem, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../types/hotel';
import dayjs from 'dayjs';
import './index.scss';

const ROOM_FILTER_TAGS = ['含早餐', '立即确认', '大床房', '双床房', '免费取', '筛选'];

export default function HotelDetail() {
  const router = useRouter();
  const id = router.params?.id;
  const params = router.params || {};
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [collected, setCollected] = useState(false);
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(
    params.checkIn ? dayjs(params.checkIn) : dayjs()
  );
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(
    params.checkOut ? dayjs(params.checkOut) : dayjs().add(1, 'day')
  );
  const [roomFilter, setRoomFilter] = useState<string | null>(null);

  const nights = checkIn && checkOut ? Math.max(1, checkOut.diff(checkIn, 'day')) : 1;
  const today = dayjs().startOf('day');
  const checkInLabel = checkIn ? (checkIn.isSame(today, 'day') ? '今天' : checkIn.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';
  const checkOutLabel = checkOut ? (checkOut.isSame(today, 'day') ? '今天' : checkOut.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';

  useEffect(() => {
    if (!id) return;
    publicHotelApi
      .getById(parseInt(id, 10))
      .then(setHotel)
      .catch(() => setHotel(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="ctrip-detail loading-wrap">
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!hotel) {
    return (
      <View className="ctrip-detail">
        <Button className="ctrip-detail-back-btn" onClick={() => Taro.navigateBack()}>
          返回列表
        </Button>
        <View className="ctrip-detail-error">
          <Text>酒店不存在或未发布</Text>
        </View>
      </View>
    );
  }

  const images = hotel.images?.length ? hotel.images : [{ imageUrl: '', description: '暂无图片' }];
  const roomTypes = (hotel.roomTypes || [])
    .slice()
    .sort((a: any, b: any) => Number(a?.price ?? 0) - Number(b?.price ?? 0));
  const minPrice = roomTypes.length
    ? Math.min(...roomTypes.map((r: any) => Number(r?.price)).filter((n: number) => !Number.isNaN(n)))
    : 0;

  const score = 4.8;
  const reviewCount = 4695;
  const reviewQuote = '中式风格装修，舒适安逸';
  const openYear = hotel.openingDate ? dayjs(hotel.openingDate).year() : '2020';
  const features = hotel.facilities?.length ? hotel.facilities : ['免费停车', '一线江景', '新中式风'];
  const transportText = hotel.transportation?.[0] || '距塘桥地铁站步行1.5公里，约22分钟';

  return (
    <View className="ctrip-detail">
      <View className="ctrip-detail-header ctrip-detail-header-overlay">
        <Text className="ctrip-back-btn" onClick={() => Taro.navigateBack()}>‹</Text>
        <Text className="ctrip-detail-title" numberOfLines={1}>{hotel.nameCn}</Text>
        <View className="ctrip-detail-header-actions">
          <Text className="ctrip-detail-action" onClick={() => setCollected(!collected)}>
            {collected ? '❤' : '♡'}
          </Text>
          <Text className="ctrip-detail-action">分享</Text>
        </View>
      </View>

      <View className="ctrip-detail-gallery">
        <Swiper className="ctrip-detail-swiper" autoplay circular indicatorDots>
          {images.map((img: any, index: number) => (
            <SwiperItem key={img.id ?? index}>
              {img.imageUrl ? (
                <Image src={img.imageUrl} mode="aspectFill" className="ctrip-detail-slide-img" />
              ) : (
                <View className="ctrip-detail-slide-placeholder" />
              )}
            </SwiperItem>
          ))}
        </Swiper>
        <View className="ctrip-detail-gallery-tags">
          <Text className="ctrip-detail-gallery-tag">封面</Text>
          <Text className="ctrip-detail-gallery-tag">精选</Text>
          <Text className="ctrip-detail-gallery-tag">位置</Text>
          <Text className="ctrip-detail-gallery-tag ctrip-detail-gallery-tag-link">相册 ›</Text>
        </View>
        <View className="ctrip-detail-gallery-mute">
          <Text>🔇 ×</Text>
        </View>
      </View>

      <ScrollView scrollY className="ctrip-detail-scroll">
        <View className="ctrip-detail-content">
          <View className="ctrip-detail-name-row">
            <Text className="ctrip-detail-name">{hotel.nameCn}</Text>
            <Text className="ctrip-detail-rate">{'★'.repeat(hotel.starRating)}</Text>
          </View>
          <View className="ctrip-detail-badges">
            <Text className="ctrip-detail-badge-link">上海美景酒店榜 No.16 ›</Text>
            <Text className="ctrip-detail-badge-gold">口碑榜 上榜酒店</Text>
          </View>

          <View className="ctrip-detail-features-row">
            <Text className="ctrip-detail-feature">{openYear}年开业</Text>
            {features.slice(0, 4).map((f) => (
              <Text key={f} className="ctrip-detail-feature">{f}</Text>
            ))}
            <Text className="ctrip-detail-feature-link">设施 ›</Text>
            <Text className="ctrip-detail-feature-link">政策 ›</Text>
          </View>

          <View className="ctrip-detail-score-location">
            <View className="ctrip-detail-score-block">
              <View className="ctrip-detail-score-pill">
                <Text className="ctrip-detail-score-num">{score}</Text>
                <Text className="ctrip-detail-score-label">超棒</Text>
                <Text className="ctrip-detail-score-reviews">{reviewCount}条 ›</Text>
              </View>
              <Text className="ctrip-detail-review-quote">"{reviewQuote}"</Text>
            </View>
            <View className="ctrip-detail-location-block">
              <Text className="ctrip-detail-transport">{transportText}</Text>
              <Text className="ctrip-detail-addr">{hotel.address}</Text>
              <Text className="ctrip-detail-map-link">📍 地图</Text>
            </View>
          </View>

          <View className="ctrip-detail-dates-row">
            <Text className="ctrip-detail-dates-icon">📅</Text>
            <Text className="ctrip-detail-dates-text">
              {checkIn?.format('M月DD日')} {checkInLabel || ''} {nights}晚 {checkOut?.format('M月DD日')} {checkOutLabel || ''}
            </Text>
            <Text className="ctrip-detail-dates-arrow">›</Text>
          </View>
          <View className="ctrip-detail-dates-tip">
            <Text className="ctrip-detail-tip-icon">🌙</Text>
            <Text>当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
          </View>

          <View className="ctrip-detail-room-filters">
            {ROOM_FILTER_TAGS.map((tag) => (
              <Text
                key={tag}
                className={`ctrip-detail-room-filter-tag ${roomFilter === tag ? 'active' : ''}`}
                onClick={() => setRoomFilter(roomFilter === tag ? null : tag)}
              >
                {tag}
              </Text>
            ))}
          </View>

          <Text className="ctrip-detail-rooms-title">房型与价格</Text>
          {roomTypes.length === 0 ? (
            <Text className="ctrip-detail-no-room">暂无房型</Text>
          ) : (
            <View className="ctrip-detail-rooms">
              {roomTypes.map((room: any, index: number) => (
                <View key={room.id ?? index} className="ctrip-detail-room">
                  {room.imageUrl && (
                    <View className="ctrip-detail-room-thumb">
                      <Image src={room.imageUrl} mode="aspectFill" className="ctrip-detail-room-thumb-img" />
                    </View>
                  )}
                  <View className="ctrip-detail-room-info">
                    <Text className="ctrip-detail-room-name">{room.name}</Text>
                    <Text className="ctrip-detail-room-desc">
                      {[room.bedType, room.roomSize && `${room.roomSize}㎡`, room.maxGuests && `${room.maxGuests}人入住`, room.floors]
                        .filter(Boolean)
                        .join(' ')}
                    </Text>
                    <View className="ctrip-detail-room-price-row">
                      <Text className="ctrip-price-num">¥{room.price}</Text>
                      {room.originalPrice && (
                        <Text className="ctrip-detail-room-original">¥{room.originalPrice}</Text>
                      )}
                      <Text className="ctrip-detail-room-unit">/晚</Text>
                    </View>
                  </View>
                  <Text className="ctrip-detail-room-info-icon">ⓘ</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View className="ctrip-detail-bottom-spacer" />
      </ScrollView>

      <View className="ctrip-detail-bottom">
        <View className="ctrip-detail-bottom-left">
          <Text className="ctrip-detail-ask-icon">💬</Text>
          <Text>问酒店</Text>
        </View>
        <View className="ctrip-detail-bottom-price">
          <Text className="ctrip-detail-bottom-label">¥{minPrice}</Text>
          <Text className="ctrip-detail-bottom-suffix">起</Text>
        </View>
        <Button className="ctrip-detail-bottom-btn">查看房型</Button>
      </View>
    </View>
  );
}
