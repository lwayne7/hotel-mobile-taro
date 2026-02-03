/**
 * 酒店详情页 - 修复版本
 * 
 * 修复内容：
 * 1. 修复 Zustand useEffect 无限循环
 * 2. 类名与 SCSS 保持一致（ctrip- 前缀）
 * 3. 支持调整入住/离店日期
 */
import { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, Swiper, SwiperItem, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { useHotelDetail } from '../../hooks/useHotels';
import { useHotelStore } from '../../store/useHotelStore';
import { Button, Skeleton, Popup } from '../../components/ui';
import Calendar from '../../components/Calendar';
import dayjs, { Dayjs } from 'dayjs';
import './index.scss';

const ROOM_FILTER_TAGS = ['含早餐', '立即确认', '大床房', '双床房', '免费取消', '筛选'];

export default function HotelDetail() {
  const router = useRouter();
  const id = router.params?.id ? parseInt(router.params.id, 10) : undefined;
  const params = router.params || {};

  // Zustand store - 使用选择器避免无限循环
  const isFavorite = useHotelStore((state) => (id ? state.favoriteIds.includes(id) : false));
  const toggleFavorite = useHotelStore((state) => state.toggleFavorite);
  const addToRecentlyViewed = useHotelStore((state) => state.addToRecentlyViewed);

  // TanStack Query
  const { data: hotel, isLoading, isError, error, refetch } = useHotelDetail(id);

  // 本地 UI 状态
  const [roomFilter, setRoomFilter] = useState<string | null>(null);
  const [scrollToId, setScrollToId] = useState('');
  const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);

  // 日期 - 使用本地状态以支持调整
  const [localCheckIn, setLocalCheckIn] = useState(
    params.checkIn ? dayjs(params.checkIn) : dayjs()
  );
  const [localCheckOut, setLocalCheckOut] = useState(
    params.checkOut ? dayjs(params.checkOut) : dayjs().add(1, 'day')
  );
  const nights = Math.max(1, localCheckOut.diff(localCheckIn, 'day'));
  const today = dayjs().startOf('day');

  // 添加到最近浏览 - 使用 ref 防止重复添加
  const addedRef = useRef(false);
  useEffect(() => {
    if (hotel && !addedRef.current) {
      addedRef.current = true;
      addToRecentlyViewed(hotel);
    }
  }, [hotel, addToRecentlyViewed]);

  const scrollToRooms = useCallback(() => {
    setScrollToId('detail-rooms');
    setTimeout(() => setScrollToId(''), 400);
  }, []);

  const goBack = useCallback(() => {
    Taro.navigateBack().catch(() => {
      Taro.redirectTo({ url: '/pages/hotel-list/index' });
    });
  }, []);

  const handleToggleFavorite = useCallback(() => {
    if (id) {
      toggleFavorite(id);
      Taro.showToast({
        title: isFavorite ? '已取消收藏' : '已收藏',
        icon: 'none',
      });
    }
  }, [id, isFavorite, toggleFavorite]);

  // 日期选择处理
  const onCalendarSelect = useCallback((date: Dayjs) => {
    if (showDatePicker === 'checkIn') {
      setLocalCheckIn(date);
      // 如果入住日期 >= 离店日期，自动调整离店日期
      if (date.isAfter(localCheckOut, 'day') || date.isSame(localCheckOut, 'day')) {
        setLocalCheckOut(date.add(1, 'day'));
      }
    } else if (showDatePicker === 'checkOut') {
      // 离店日期必须在入住日期之后
      if (date.isAfter(localCheckIn, 'day')) {
        setLocalCheckOut(date);
      } else {
        setLocalCheckOut(localCheckIn.add(1, 'day'));
      }
    }
    setShowDatePicker(null);
  }, [showDatePicker, localCheckIn, localCheckOut]);

  // 加载中
  if (isLoading) {
    return (
      <View className="ctrip-detail loading-wrap">
        <View className="ctrip-detail-header-overlay">
          <View className="ctrip-back-btn" onClick={goBack}>
            <Text className="back-arrow">‹</Text>
          </View>
        </View>
        <View style={{ padding: '24px' }}>
          <Skeleton loading rows={0} avatar avatarSize={200} avatarShape="square" />
          <Skeleton loading rows={4} title />
        </View>
      </View>
    );
  }

  // 错误状态
  if (isError || !hotel) {
    return (
      <View className="ctrip-detail">
        <View className="ctrip-detail-header-overlay">
          <View className="ctrip-back-btn" onClick={goBack}>
            <Text className="back-arrow">‹</Text>
          </View>
        </View>
        <View style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Text style={{ color: '#999', marginBottom: '16px', display: 'block' }}>
            {error?.message || '酒店不存在或未发布'}
          </Text>
          <Button type="primary" onClick={() => refetch()}>重试</Button>
          <View style={{ height: '12px' }} />
          <Button onClick={goBack}>返回列表</Button>
        </View>
      </View>
    );
  }

  // 数据处理
  const images = hotel.images?.length ? hotel.images : [{ imageUrl: '', description: '暂无图片' }];
  const allRoomTypes = (hotel.roomTypes || [])
    .slice()
    .sort((a: any, b: any) => Number(a?.price ?? 0) - Number(b?.price ?? 0));

  // 根据筛选标签过滤房型
  const roomTypes = allRoomTypes.filter((room: any) => {
    if (!roomFilter) return true;

    const bedType = room.bedType?.toLowerCase() || '';
    const amenities = (room.amenities || []).map((a: string) => a.toLowerCase());
    const roomName = room.name?.toLowerCase() || '';

    switch (roomFilter) {
      case '含早餐':
        return amenities.includes('早餐') || amenities.includes('含早餐') || amenities.includes('含早');
      case '立即确认':
        return amenities.includes('立即确认') || amenities.includes('闪订');
      case '大床房':
        return bedType.includes('大床') || roomName.includes('大床');
      case '双床房':
        return bedType.includes('双床') || bedType.includes('标准') || roomName.includes('双床') || roomName.includes('标准');
      case '免费取消':
        return amenities.includes('免费取消') || amenities.includes('可取消');
      default:
        return true;
    }
  });

  const minPrice = allRoomTypes.length
    ? Math.min(...allRoomTypes.map((r: any) => Number(r?.price)).filter((n: number) => !isNaN(n)))
    : 0;

  const score = 4.8;
  const openYear = hotel.openingDate ? dayjs(hotel.openingDate).year() : '2020';
  const features = hotel.facilities?.length ? hotel.facilities.slice(0, 4) : ['免费WiFi', '停车场', '新中式风', '24h前台'];

  return (
    <View className="ctrip-detail">
      {/* Header */}
      <View className="ctrip-detail-header-overlay">
        <View className="ctrip-back-btn" onClick={goBack}>
          <Text className="back-arrow">‹</Text>
        </View>
        <View className="ctrip-detail-header-actions">
          <Text className="ctrip-detail-action" onClick={handleToggleFavorite}>
            {isFavorite ? '❤' : '♡'}
          </Text>
          <Text
            className="ctrip-detail-action"
            onClick={() => Taro.showToast({ title: '分享功能敬请期待', icon: 'none' })}
          >
            ⋮
          </Text>
        </View>
      </View>

      <ScrollView scrollY className="ctrip-detail-scroll" scrollIntoView={scrollToId}>
        {/* Gallery */}
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
            <Text className="ctrip-detail-gallery-tag">实景</Text>
            <Text className="ctrip-detail-gallery-tag">{images.length}张</Text>
          </View>
        </View>

        {/* Info */}
        <View className="ctrip-detail-content">
          <View className="ctrip-detail-name-row">
            <Text className="ctrip-detail-name">{hotel.nameCn}</Text>
            <Text className="ctrip-detail-rate">{'★'.repeat(hotel.starRating)}</Text>
          </View>
          {hotel.nameEn && (
            <Text className="ctrip-detail-name-en">{hotel.nameEn}</Text>
          )}

          <View className="ctrip-detail-badges">
            <Text className="ctrip-detail-badge-link">{openYear}年开业</Text>
          </View>

          <View className="ctrip-detail-features-row">
            {features.map((f, i) => (
              <View key={i} className="feature-item">
                <View className="feature-icon">
                  {i === 0 ? '📶' : i === 1 ? '🅿️' : i === 2 ? '🏠' : '🛎️'}
                </View>
                <Text className="feature-text">{f}</Text>
              </View>
            ))}
            <Text className="ctrip-detail-feature-link">查看全部 &gt;</Text>
          </View>

          {/* Score & Location */}
          <View className="ctrip-detail-score-location">
            <View className="ctrip-detail-score-block">
              <View className="ctrip-detail-score-pill">
                <Text className="ctrip-detail-score-num">{score}</Text>
                <Text className="ctrip-detail-score-label">超棒</Text>
              </View>
              <Text className="ctrip-detail-score-reviews">1,234条点评</Text>
            </View>
            <View className="ctrip-detail-divider-v" />
            <View className="ctrip-detail-location-block">
              <Text className="ctrip-detail-addr">{hotel.address}</Text>
              <View className="ctrip-detail-map-link">
                <Text>📍</Text>
                <Text>地图</Text>
              </View>
            </View>
          </View>

          {/* Nearby Info */}
          {((hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0) ||
            (hotel.transportation && hotel.transportation.length > 0)) && (
              <View className="ctrip-detail-nearby">
                {hotel.nearbyAttractions && hotel.nearbyAttractions.length > 0 && (
                  <View className="nearby-section">
                    <Text className="nearby-title">🎯 附近景点</Text>
                    <View className="nearby-tags">
                      {hotel.nearbyAttractions.slice(0, 4).map((item: string, idx: number) => (
                        <Text key={idx} className="nearby-tag">{item}</Text>
                      ))}
                    </View>
                  </View>
                )}
                {hotel.transportation && hotel.transportation.length > 0 && (
                  <View className="nearby-section">
                    <Text className="nearby-title">🚇 交通信息</Text>
                    <View className="nearby-tags">
                      {hotel.transportation.slice(0, 4).map((item: string, idx: number) => (
                        <Text key={idx} className="nearby-tag">{item}</Text>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
        </View>

        {/* Date Card - 可点击调整日期 */}
        <View className="ctrip-detail-dates-card">
          <View className="dates-row">
            <View className="date-section date-section-clickable" onClick={() => setShowDatePicker('checkIn')}>
              <Text className="date-val">{localCheckIn.format('MM-DD')}</Text>
              <Text className="date-label">入住 ›</Text>
            </View>
            <View className="date-nights-wrap">
              <Text className="date-nights">{nights}晚</Text>
            </View>
            <View className="date-section date-section-right date-section-clickable" onClick={() => setShowDatePicker('checkOut')}>
              <Text className="date-val">{localCheckOut.format('MM-DD')}</Text>
              <Text className="date-label">› 离店</Text>
            </View>
          </View>
          <View className="dates-tip">
            <Text>14:00后入住</Text>
            <Text className="dates-tip-dot">·</Text>
            <Text>12:00前离店</Text>
          </View>
        </View>

        {/* Room Filters */}
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

        {/* Room List */}
        <View id="detail-rooms" className="ctrip-detail-rooms">
          {roomTypes.length === 0 ? (
            <View style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
              <Text>暂无房型</Text>
            </View>
          ) : (
            roomTypes.map((room: any, index: number) => (
              <View key={room.id ?? index} className="ctrip-detail-room">
                <View className="ctrip-detail-room-thumb">
                  {room.imageUrl || hotel.images?.[0]?.imageUrl ? (
                    <Image
                      src={room.imageUrl || hotel.images?.[0]?.imageUrl}
                      mode="aspectFill"
                      className="ctrip-detail-room-thumb-img"
                    />
                  ) : (
                    <View className="room-thumb-placeholder">
                      <Text>🛏️</Text>
                    </View>
                  )}
                </View>
                <View className="ctrip-detail-room-info">
                  <Text className="ctrip-detail-room-name">{room.name}</Text>
                  <Text className="ctrip-detail-room-desc">
                    {[room.bedType, room.roomSize && `${room.roomSize}㎡`, room.maxGuests && `${room.maxGuests}人`]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  <View className="room-price-row">
                    <View className="price-wrap">
                      <Text className="currency">¥</Text>
                      <Text className="amount">{room.price}</Text>
                      <Text className="suffix">/晚</Text>
                    </View>
                    <Text className="view-room-btn" onClick={scrollToRooms}>预订</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="ctrip-detail-bottom-spacer" />
      </ScrollView>

      {/* Bottom Bar */}
      <View className="ctrip-detail-bottom">
        <View className="ctrip-detail-bottom-left">
          <Text className="ctrip-detail-ask-icon">💬</Text>
          <Text>咨询</Text>
        </View>
        <View className="ctrip-detail-bottom-price">
          <Text className="ctrip-detail-bottom-label">¥{minPrice}</Text>
          <Text className="ctrip-detail-bottom-suffix">起</Text>
        </View>
        <Text className="ctrip-detail-bottom-btn" onClick={scrollToRooms}>查看房型</Text>
      </View>

      {/* Calendar Popup */}
      <Popup
        visible={!!showDatePicker}
        position="bottom"
        onClose={() => setShowDatePicker(null)}
      >
        <View className="calendar-popup-content">
          <Calendar
            value={showDatePicker === 'checkIn' ? localCheckIn : localCheckOut}
            minDate={showDatePicker === 'checkIn' ? today : localCheckIn.add(1, 'day')}
            onChange={onCalendarSelect}
            title={showDatePicker === 'checkIn' ? '选择入住日期' : '选择离店日期'}
          />
        </View>
      </Popup>
    </View>
  );
}
