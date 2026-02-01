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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [collected, setCollected] = useState(false);
  const [checkIn, setCheckIn] = useState<dayjs.Dayjs | null>(
    params.checkIn ? dayjs(params.checkIn) : dayjs()
  );
  const [checkOut, setCheckOut] = useState<dayjs.Dayjs | null>(
    params.checkOut ? dayjs(params.checkOut) : dayjs().add(1, 'day')
  );
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [scrollToId, setScrollToId] = useState('');

  const scrollToRooms = () => {
    setScrollToId('detail-rooms');
    setTimeout(() => setScrollToId(''), 400);
  };

  const nights = checkIn && checkOut ? Math.max(1, checkOut.diff(checkIn, 'day')) : 1;
  const today = dayjs().startOf('day');
  const checkInLabel = checkIn ? (checkIn.isSame(today, 'day') ? '今天' : checkIn.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';
  const checkOutLabel = checkOut ? (checkOut.isSame(today, 'day') ? '今天' : checkOut.isSame(today.add(1, 'day'), 'day') ? '明天' : '') : '';

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    publicHotelApi
      .getById(parseInt(id, 10))
      .then(setHotel)
      .catch((e) => {
        setHotel(null);
        setLoadError(e?.message || '加载失败，请稍后重试');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="ctrip-detail loading-wrap">
        <Text>加载中...</Text>
      </View>
    );
  }

  const goBack = () => {
    Taro.navigateBack().catch(() => {
      Taro.redirectTo({ url: '/pages/hotel-list/index' });
    });
  };

  if (!hotel) {
    return (
      <View className="ctrip-detail">
        <Button className="ctrip-detail-back-btn" onClick={goBack}>
          返回列表
        </Button>
        <View className="ctrip-detail-error">
          <Text>{loadError || '酒店不存在或未发布'}</Text>
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
        <View className="ctrip-back-btn" onClick={goBack}>
          <Text className="back-arrow">‹</Text>
        </View>
        <View className="ctrip-detail-header-actions">
          <Text className="ctrip-detail-action" onClick={() => setCollected(!collected)}>
            {collected ? '❤' : '♡'}
          </Text>
          <Text className="ctrip-detail-action" onClick={() => Taro.showToast({ title: '分享功能敬请期待', icon: 'none' })}>分享</Text>
        </View>
      </View>

      <ScrollView scrollY className="ctrip-detail-scroll" scrollIntoView={scrollToId}>
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
            <Text className="ctrip-detail-gallery-tag ctrip-detail-gallery-tag-link" onClick={() => Taro.showToast({ title: '相册敬请期待', icon: 'none' })}>相册 ›</Text>
          </View>
        </View>

        <View className="ctrip-detail-content">
          <View className="ctrip-detail-name-row">
            <Text className="ctrip-detail-name">{hotel.nameCn}</Text>
            <Text className="ctrip-detail-rate">{'★'.repeat(hotel.starRating)}</Text>
          </View>
          <View className="ctrip-detail-badges">
            <Text className="ctrip-detail-badge-link" onClick={() => Taro.showToast({ title: '榜单详情敬请期待', icon: 'none' })}>
              {hotel.address?.match(/^(.+?[市省])/)?.[1] || '精选'}美景酒店榜 No.{(hotel.id % 20) + 1} ›
            </Text>
          </View>

          <View className="ctrip-detail-features-row">
            <View className="feature-item">
              <Text className="feature-icon">▤</Text>
              <Text className="feature-text">{openYear}年开业</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">◈</Text>
              <Text className="feature-text">新中式风</Text>
            </View>
            {features.slice(0, 2).map((f) => (
              <View key={f} className="feature-item">
                <Text className="feature-icon">℗</Text>
                <Text className="feature-text">{f}</Text>
              </View>
            ))}
            <Text className="ctrip-detail-feature-link" onClick={() => Taro.showToast({ title: '设施政策敬请期待', icon: 'none' })}>设施政策 ›</Text>
          </View>

          <View className="ctrip-detail-score-location">
            <View className="ctrip-detail-score-block">
              <View className="ctrip-detail-score-pill">
                <Text className="ctrip-detail-score-num">{score}</Text>
                <Text className="ctrip-detail-score-label">超棒</Text>
              </View>
              <Text className="ctrip-detail-score-reviews" onClick={() => Taro.showToast({ title: '点评列表敬请期待', icon: 'none' })}>{reviewCount}条点评 ›</Text>
            </View>
            <View className="ctrip-detail-divider-v" />
            <View className="ctrip-detail-location-block">
              <Text className="ctrip-detail-addr">{transportText}</Text>
              <Text className="ctrip-detail-map-link" onClick={() => Taro.showToast({ title: hotel.address || '地图敬请期待', icon: 'none' })}>地图</Text>
            </View>
          </View>
        </View>

        <View className="ctrip-detail-dates-card" onClick={() => Taro.showToast({ title: '请返回查询页修改日期', icon: 'none' })}>
          <View className="dates-row">
            <Text className="date-val">{checkIn?.format('MM月DD日')}</Text>
            <Text className="date-label">{checkInLabel}</Text>
            <Text className="date-nights">{nights}晚</Text>
            <Text className="date-val">{checkOut?.format('MM月DD日')}</Text>
            <Text className="date-label">{checkOutLabel}</Text>
            <Text className="dates-arrow">›</Text>
          </View>
          <View className="dates-tip">
            <Text className="tip-badge">🌙</Text>
            <Text className="tip-text">当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
          </View>
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

        <View id="detail-rooms" className="ctrip-detail-rooms">
          {roomTypes.length === 0 ? (
            <Text className="ctrip-detail-no-room">暂无房型</Text>
          ) : (
            <>
              {roomTypes.map((room: any, index: number) => (
                <View key={room.id ?? index} className="ctrip-detail-room">
                  <View className="ctrip-detail-room-thumb">
                    {room.imageUrl ? (
                      <Image src={room.imageUrl} mode="aspectFill" className="ctrip-detail-room-thumb-img" />
                    ) : hotel.images?.[0]?.imageUrl ? (
                      <Image src={hotel.images[0].imageUrl} mode="aspectFill" className="ctrip-detail-room-thumb-img" />
                    ) : (
                      <View className="room-thumb-placeholder"><Text>🛏️</Text></View>
                    )}
                  </View>
                  <View className="ctrip-detail-room-info">
                    <Text className="ctrip-detail-room-name">{room.name}</Text>
                    <Text className="ctrip-detail-room-desc">
                      {[room.bedType, room.roomSize && `${room.roomSize}㎡`, room.maxGuests && `${room.maxGuests}人入住`].filter(Boolean).join(' ')}
                    </Text>
                    <View className="room-price-row">
                      <View className="price-wrap">
                        <Text className="currency">¥</Text>
                        <Text className="amount">{room.price}</Text>
                        <Text className="suffix">起</Text>
                      </View>
                      <Button className="view-room-btn" onClick={scrollToRooms}>查看房型</Button>
                    </View>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View className="ctrip-detail-bottom-spacer" />
      </ScrollView>

      {/* Bottom Fixed Bar */}
      <View className="ctrip-detail-bottom">
        <View className="ctrip-detail-bottom-left" onClick={() => Taro.showToast({ title: '问酒店敬请期待', icon: 'none' })}>
          <Text className="ctrip-detail-ask-icon">💬</Text>
          <Text>问酒店</Text>
        </View>
        <View className="ctrip-detail-bottom-price">
          <Text className="ctrip-detail-bottom-label">¥{minPrice}</Text>
          <Text className="ctrip-detail-bottom-suffix">起</Text>
        </View>
        <Button className="ctrip-detail-bottom-btn" onClick={scrollToRooms}>查看房型</Button>
      </View>
    </View>
  );
}
