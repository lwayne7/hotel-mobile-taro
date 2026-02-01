import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView, Image } from '@tarojs/components';
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
  { value: 0, label: '不限' },
  { value: 2, label: '经济型' },
  { value: 3, label: '舒适型' },
  { value: 4, label: '高档型' },
  { value: 5, label: '豪华型' },
];

const PRICE_OPTIONS = ['不限', '¥150以下', '¥150-300', '¥300-450', '¥450-600', '¥600以上'];

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
  const [priceRange, setPriceRange] = useState('不限');
  const [bannerHotels, setBannerHotels] = useState<Hotel[]>([]);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [pickingCheckIn, setPickingCheckIn] = useState(true);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

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
    if (priceRange !== '不限') params.set('priceRange', priceRange);
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

  // GPS定位功能
  const handleGpsLocation = () => {
    setGpsLoading(true);
    Taro.getLocation({
      type: 'wgs84',
      success: (res) => {
        setGpsLoading(false);
        const { longitude } = res;
        // 基于经度简单判断城市（实际应用需要使用地理编码API）
        let detectedCity = '上海';
        if (longitude < 110) detectedCity = '成都';
        else if (longitude < 114) detectedCity = '广州';
        else if (longitude < 117) detectedCity = '深圳';
        else if (longitude < 120) detectedCity = '杭州';
        else if (longitude < 122) detectedCity = '上海';
        else detectedCity = '北京';
        setCity(detectedCity);
        Taro.showToast({ title: `已定位到: ${detectedCity}`, icon: 'none' });
      },
      fail: () => {
        setGpsLoading(false);
        Taro.showToast({ title: '定位失败，请手动选择城市', icon: 'none' });
      },
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

  const getFilterSummary = () => {
    const parts: string[] = [];
    const starLabel = STAR_OPTIONS.find((s) => s.value === starRating)?.label;
    if (starRating > 0 && starLabel) parts.push(starLabel);
    if (priceRange !== '不限') parts.push(priceRange);
    return parts.length > 0 ? parts.join('/') : '低价/高档';
  };

  return (
    <ScrollView scrollY className="page-search">
      <View className="ctrip-search">
        <View className="ctrip-header-title">酒店查询页</View>

        <View className="ctrip-img-card">
          <View className="ctrip-img-banner">
            <View className="banner-title-row">
              <Text className="banner-big-text">酒店7折起</Text>
              <View className="banner-tags">
                <Text className="banner-tag gold">资质说明</Text>
                <Text className="banner-tag trans">宠物友好酒店</Text>
              </View>
            </View>
          </View>

          <View className="search-card-container">
            <View className="ctrip-search-tabs">
              {TABS.map((tab) => (
                <View
                  key={tab.key}
                  className={`ctrip-search-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <Text className="tab-label">{tab.label}</Text>
                  {activeTab === tab.key && <View className="tab-indicator" />}
                </View>
              ))}
            </View>

            <View className="search-fields">
              {/* City & Keyword */}
              <View className="search-row border-bottom">
                <View className="city-selector" onClick={() => setShowCityModal(true)}>
                  <Text className="city-text">{city}</Text>
                  <Text className="city-arrow">▼</Text>
                </View>
                <View className="divider-vertical" />
                <Input
                  className="keyword-input"
                  placeholder="位置/品牌/酒店"
                  placeholderClass="placeholder-gray"
                  value={keyword}
                  onInput={(e) => setKeyword(e.detail.value)}
                />
                <View
                  className={`gps-icon ${gpsLoading ? 'loading' : ''}`}
                  onClick={handleGpsLocation}
                >
                  <Text className="gps-symbol">{gpsLoading ? '...' : '⌖'}</Text>
                </View>
              </View>

              {/* Dates */}
              <View className="search-row date-row border-bottom">
                <View className="date-col" onClick={() => openCalendar(true)}>
                  <View className="date-header">
                    <Text className="date-big">{checkIn?.format('MM月DD日')}</Text>
                    <Text className="date-small">今天</Text>
                  </View>
                </View>
                <View className="date-duration">
                  <Text className="duration-text"> - </Text>
                </View>
                <View className="date-col" onClick={() => openCalendar(false)}>
                  <View className="date-header">
                    <Text className="date-big">{checkOut?.format('MM月DD日')}</Text>
                    <Text className="date-small">明天</Text>
                  </View>
                </View>
                <View className="total-nights">
                  <Text>共{nights}晚</Text>
                </View>
              </View>

              {/* Tip */}
              <View className="search-tip-row">
                <Text className="tip-badge">🌙</Text>
                <Text className="tip-text">当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
              </View>

              {/* Price/Star */}
              <View className="search-row border-bottom" style={{ padding: '12px 0' }}>
                <View className="price-star-selector" onClick={() => setShowFilterModal(true)}>
                  <Text className="price-placeholder">价格/星级</Text>
                  <Text className="filter-summary">{getFilterSummary()}</Text>
                </View>
              </View>

              {/* Quick Tags */}
              <View className="quick-tags-row">
                {QUICK_TAGS.map((t, index) => (
                  <View key={index} className="quick-tag-item">
                    <Text>{t}</Text>
                  </View>
                ))}
              </View>

              {/* Button */}
              <Button className="search-submit-btn" onClick={handleSearch}>
                查询
              </Button>
            </View>
          </View>
        </View>

        {/* Section: Hot Cities */}
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

        {/* Recommended Hotels */}
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
                      <Image src={h.images[0].imageUrl} mode="aspectFill" className="ctrip-banner-img" />
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

        {/* Calendar Picker */}
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

        {/* City Selection Modal */}
        {showCityModal && (
          <View className="ctrip-modal-overlay" onClick={() => setShowCityModal(false)}>
            <View className="ctrip-modal-content" onClick={(e) => e.stopPropagation()}>
              <View className="modal-header">
                <Text className="modal-title">选择城市</Text>
                <Text className="modal-close" onClick={() => setShowCityModal(false)}>✕</Text>
              </View>
              <View className="city-modal-list">
                {POPULAR_CITIES.map((c) => (
                  <Text
                    key={c}
                    className={`city-modal-item ${city === c ? 'active' : ''}`}
                    onClick={() => {
                      setCity(c);
                      setShowCityModal(false);
                    }}
                  >
                    {c}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <View className="ctrip-modal-overlay" onClick={() => setShowFilterModal(false)}>
            <View className="ctrip-modal-content" onClick={(e) => e.stopPropagation()}>
              <View className="modal-header">
                <Text className="modal-title">筛选条件</Text>
                <Text className="modal-close" onClick={() => setShowFilterModal(false)}>✕</Text>
              </View>
              <View className="filter-section">
                <Text className="filter-label">酒店星级</Text>
                <View className="filter-options">
                  {STAR_OPTIONS.map((s) => (
                    <Text
                      key={s.value}
                      className={`filter-option ${starRating === s.value ? 'active' : ''}`}
                      onClick={() => setStarRating(s.value)}
                    >
                      {s.label}
                    </Text>
                  ))}
                </View>
              </View>
              <View className="filter-section">
                <Text className="filter-label">价格区间</Text>
                <View className="filter-price-tags">
                  {PRICE_OPTIONS.map((p) => (
                    <Text
                      key={p}
                      className={`filter-price-tag ${priceRange === p ? 'active' : ''}`}
                      onClick={() => setPriceRange(p)}
                    >
                      {p}
                    </Text>
                  ))}
                </View>
              </View>
              <View className="modal-footer">
                <Button
                  className="modal-btn reset"
                  onClick={() => { setStarRating(0); setPriceRange('不限'); }}
                >
                  重置
                </Button>
                <Button
                  className="modal-btn confirm"
                  onClick={() => setShowFilterModal(false)}
                >
                  确定
                </Button>
              </View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
