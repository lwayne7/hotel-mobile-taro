import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../types/hotel';
import Calendar from '../../components/Calendar';
import dayjs, { Dayjs } from 'dayjs';
import './index.scss';

const TABS = [
  { key: 'domestic', label: '国内' },
  { key: 'overseas', label: '海外' },
  { key: 'hourly', label: '钟点房' },
  { key: 'homestay', label: '民宿' },
];

const STAR_OPTIONS = [
  { value: 0, label: '价格/星级' },
  { value: 5, label: '五星' },
  { value: 4, label: '四星' },
  { value: 3, label: '三星' },
];

const POPULAR_CITIES = [
  '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
  '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
];

const QUICK_TAGS = ['免费停车场', '上海浦东国际机场', '上海虹桥国际机场', '外滩', '含早餐'];

export default function Index() {
  const [activeTab, setActiveTab] = useState('domestic');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('上海');
  const [checkIn, setCheckIn] = useState<Dayjs | null>(dayjs());
  const [checkOut, setCheckOut] = useState<Dayjs | null>(dayjs().add(1, 'day'));
  const [starRating, setStarRating] = useState(0);
  const [bannerHotels, setBannerHotels] = useState<Hotel[]>([]);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [pickingCheckIn, setPickingCheckIn] = useState(true);

  const nights = checkIn && checkOut ? Math.max(0, checkOut.diff(checkIn, 'day')) : 1;
  const minDate = dayjs().startOf('day');

  useEffect(() => {
    publicHotelApi
      .getList({ page: 1, pageSize: 5 })
      .then((res) => setBannerHotels(res.data || []))
      .catch(() => Taro.showToast({ title: '加载失败', icon: 'none' }));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (city.trim()) params.set('city', city.trim());
    if (checkIn) params.set('checkIn', checkIn.format('YYYY-MM-DD'));
    if (checkOut) params.set('checkOut', checkOut.format('YYYY-MM-DD'));
    if (starRating > 0) params.set('starRating', String(starRating));
    Taro.navigateTo({
      url: `/pages/hotel-list/index?${params.toString()}`,
    });
  };

  const setCityAndSearch = (c: string) => {
    setCity(c);
    Taro.navigateTo({
      url: `/pages/hotel-list/index?city=${encodeURIComponent(c)}`,
    });
  };

  const openCalendar = (isCheckIn: boolean) => {
    setPickingCheckIn(isCheckIn);
    if (isCheckIn) setShowCheckInCalendar(true);
    else setShowCheckOutCalendar(true);
  };

  const onCalendarSelect = (date: Dayjs) => {
    if (pickingCheckIn) {
      setCheckIn(date);
      if (checkOut && date.isAfter(checkOut, 'day')) setCheckOut(date.add(1, 'day'));
      setShowCheckInCalendar(false);
    } else {
      setCheckOut(date);
      if (checkIn && date.isBefore(checkIn, 'day')) setCheckIn(date.subtract(1, 'day'));
      setShowCheckOutCalendar(false);
    }
  };

  return (
    <ScrollView scrollY className="page-search">
      <View className="ctrip-search">
        <View className="ctrip-search-header">
          <View className="ctrip-search-brand">
            <Text className="ctrip-search-logo">易宿</Text>
            <Text className="ctrip-search-slogan">酒店·民宿</Text>
          </View>
        </View>
        <View className="ctrip-search-page-title">酒店查询页</View>

        <View className="ctrip-search-banner">
          <View className="ctrip-search-banner-bg" />
          <View className="ctrip-search-banner-content">
            <Text className="ctrip-search-banner-text">酒店7折起</Text>
            <View className="ctrip-search-banner-tags">
              <Text className="ctrip-search-banner-tag">资质说明</Text>
              <Text className="ctrip-search-banner-tag">精选推荐</Text>
            </View>
          </View>
        </View>

        <View className="ctrip-search-tabs">
          {TABS.map((tab) => (
            <Text
              key={tab.key}
              className={`ctrip-search-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Text>
          ))}
        </View>

        <View className="ctrip-search-main">
          <View className="ctrip-search-row-first">
            <View className="ctrip-search-city" onClick={() => Taro.showToast({ title: '可弹窗选择城市', icon: 'none' })}>
              <Text>{city || '选择城市'}</Text>
              <Text className="ctrip-search-arrow">▼</Text>
            </View>
            <Input
              placeholder="位置/品牌/酒店"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              className="ctrip-search-input-inline"
            />
            <View className="ctrip-search-gps" onClick={() => Taro.showToast({ title: '定位', icon: 'none' })}>
              <Text>📍</Text>
            </View>
          </View>

          <View className="ctrip-search-row-dates">
            <Text className="ctrip-search-date-label">住</Text>
            <Text
              className="ctrip-search-date-value"
              onClick={() => openCalendar(true)}
            >
              {checkIn ? checkIn.format('MM月DD日') : '入住'}
            </Text>
            <Text className="ctrip-search-date-tag">{checkIn?.isSame(dayjs(), 'day') ? '今天' : ''}</Text>
            <Text className="ctrip-search-date-dash">-</Text>
            <Text className="ctrip-search-date-label">离</Text>
            <Text
              className="ctrip-search-date-value"
              onClick={() => openCalendar(false)}
            >
              {checkOut ? checkOut.format('MM月DD日') : '离店'}
            </Text>
            <Text className="ctrip-search-date-tag">{checkOut?.isSame(dayjs().add(1, 'day'), 'day') ? '明天' : ''}</Text>
            <Text className="ctrip-search-date-nights">共{nights}晚</Text>
          </View>

          {(showCheckInCalendar || showCheckOutCalendar) && (
            <View className="ctrip-search-calendar-wrap">
              <Calendar
                value={pickingCheckIn ? checkIn || undefined : checkOut || undefined}
                minDate={pickingCheckIn ? minDate : (checkIn || minDate)}
                onChange={onCalendarSelect}
                title={pickingCheckIn ? '选择入住日期' : '选择离店日期'}
              />
            </View>
          )}

          <View className="ctrip-search-tip">
            <Text className="ctrip-search-tip-icon">🌙</Text>
            <Text>当前已过0点，如需今天凌晨6点前入住，请选择「今天凌晨」</Text>
          </View>

          <View className="ctrip-search-row-price">
            <View className="ctrip-search-price-select-wrap">
              <picker
                mode="selector"
                range={STAR_OPTIONS}
                rangeKey="label"
                value={STAR_OPTIONS.findIndex((o) => o.value === starRating)}
                onChange={(e) => setStarRating(STAR_OPTIONS[Number(e.detail.value)]?.value ?? 0)}
              >
                <View className="ctrip-search-picker">
                  {STAR_OPTIONS.find((o) => o.value === starRating)?.label || '价格/星级'} ▼
                </View>
              </picker>
            </View>
          </View>

          <View className="ctrip-search-quick-tags">
            {QUICK_TAGS.map((t) => (
              <Text
                key={t}
                className="ctrip-search-quick-tag"
                onClick={() => Taro.showToast({ title: `筛选：${t}`, icon: 'none' })}
              >
                {t}
              </Text>
            ))}
          </View>

          <Button className="ctrip-search-btn" onClick={handleSearch}>
            查询
          </Button>
        </View>

        <View className="ctrip-section">
          <Text className="ctrip-section-title">热门城市</Text>
          <View className="ctrip-city-chips">
            {POPULAR_CITIES.map((c) => (
              <Text key={c} className="ctrip-chip" onClick={() => setCityAndSearch(c)}>
                {c}
              </Text>
            ))}
          </View>
        </View>

        {bannerHotels.length > 0 && (
          <View className="ctrip-section">
            <Text className="ctrip-section-title">推荐酒店</Text>
            <ScrollView scrollX className="ctrip-banner-scroll">
              {bannerHotels.map((h) => (
                <View
                  key={h.id}
                  className="ctrip-banner-card"
                  onClick={() => Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${h.id}` })}
                >
                  <View className="ctrip-banner-cover">
                    {h.images?.[0]?.imageUrl ? (
                      <image src={h.images[0].imageUrl} mode="aspectFill" className="ctrip-banner-img" />
                    ) : (
                      <View className="ctrip-banner-placeholder" />
                    )}
                  </View>
                  <View className="ctrip-banner-info">
                    <Text className="ctrip-banner-name">{h.nameCn}</Text>
                    <Text className="ctrip-banner-addr">{h.address}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
