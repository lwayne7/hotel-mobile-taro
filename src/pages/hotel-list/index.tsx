/**
 * 酒店列表页 - 完整筛选版本
 * 
 * 功能：
 * 1. 智能排序、位置距离、价格/星级、综合筛选四个筛选面板
 * 2. 快速筛选标签
 * 3. 城市、日期、房间选择
 * 4. GPS定位（支持HTTPS检测）
 * 5. 无限滚动加载
 */
import { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, Input, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';

const HISTORY_TAGS_STORAGE_KEY = 'hotel_filter_history_tags';
import { useInfiniteHotelList, flattenHotelPages, getTotalFromPages } from '../../hooks/useHotels';
import { useLocation } from '../../hooks/useLocation';
import { platform } from '../../styles/rn-utils';
import { useSearchStore } from '../../store/useSearchStore';
import { useHotelStore } from '../../store/useHotelStore';
import { HotelCard, Skeleton, Popup } from '../../components/ui';
import Calendar from '../../components/Calendar';
import { POPULAR_CITIES } from '../../constants/cities';
import { LocationFilter, PriceFilter, GeneralFilter } from './components';
import { FilterTabs } from './components/FilterTabs';
import { HotelListContent } from './components/HotelListContent';
import type { Hotel, HotelListResponse } from '../../types/hotel';
import { toQueryString } from '../../utils/queryString';
import { getApiBaseCacheKey } from '../../services/request';
import dayjs, { Dayjs } from 'dayjs';
import './index.scss';

const PAGE_SIZE = 50;

function decodeParam(value: string | undefined): string {
  if (!value || typeof value !== 'string') return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function HotelList() {
  const router = useRouter();
  const rawParams = router.params || {};
  const isWeappDevtools = useMemo(() => {
    if (!platform.isWeapp) return false;
    try {
      return Taro.getSystemInfoSync().platform === 'devtools';
    } catch {
      return false;
    }
  }, []);

  // Zustand - 使用选择器
  const city = useSearchStore((s) => s.city);
  const keyword = useSearchStore((s) => s.keyword);
  const starRating = useSearchStore((s) => s.starRating);
  const storeMinPrice = useSearchStore((s) => s.minPrice);
  const storeMaxPrice = useSearchStore((s) => s.maxPrice);
  const storeCheckIn = useSearchStore((s) => s.checkIn);
  const storeCheckOut = useSearchStore((s) => s.checkOut);
  const setKeyword = useSearchStore((s) => s.setKeyword);
  const addToRecentlyViewed = useHotelStore((s) => s.addToRecentlyViewed);

  // ========== 筛选状态 ==========
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('smart');
  const [localKeyword, setLocalKeyword] = useState(decodeParam(rawParams.keyword) || keyword);
  
  // 位置筛选
  const [locationCategory, setLocationCategory] = useState('hot');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [maxDistance, setMaxDistance] = useState<number | null>(null);
  
  // 价格/星级筛选
  const [minPrice, setMinPrice] = useState<number | null>(storeMinPrice ?? null);
  const [maxPrice, setMaxPrice] = useState<number | null>(storeMaxPrice ?? null);
  const [priceRange, setPriceRange] = useState<string | null>(null);
  const [localStarRating, setLocalStarRating] = useState<number | null>(starRating);
  
  // 综合筛选
  const [hotTags, setHotTags] = useState<string[]>([]);
  const [accommodationType, setAccommodationType] = useState<string[]>([]);
  const [hotelFeatures, setHotelFeatures] = useState<string[]>([]);
  const [roomFeatures, setRoomFeatures] = useState<string[]>([]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [historyTags, setHistoryTags] = useState<string[]>([]);

  // ========== 历史筛选持久化 ==========
  // 加载历史筛选
  useEffect(() => {
    const loadHistoryTags = async () => {
      try {
        const res = await Taro.getStorage({ key: HISTORY_TAGS_STORAGE_KEY });
        if (res.data && Array.isArray(res.data)) {
          setHistoryTags(res.data);
        }
      } catch {
        // 没有存储数据，忽略错误
      }
    };
    loadHistoryTags();
  }, []);

  // 保存历史筛选
  useEffect(() => {
    if (historyTags.length > 0) {
      Taro.setStorage({ key: HISTORY_TAGS_STORAGE_KEY, data: historyTags });
    }
  }, [historyTags]);

  // ========== 其他弹窗状态 ==========
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);
  const [showRoomPicker, setShowRoomPicker] = useState(false);

  // 本地筛选参数
  const [localCity, setLocalCity] = useState(decodeParam(rawParams.city) || city || '上海');
  const [localCheckIn, setLocalCheckIn] = useState(
    rawParams.checkIn ? dayjs(rawParams.checkIn) : dayjs(storeCheckIn)
  );
  const [localCheckOut, setLocalCheckOut] = useState(
    rawParams.checkOut ? dayjs(rawParams.checkOut) : dayjs(storeCheckOut)
  );
  const [rooms, setRooms] = useState(1);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // ========== 定位 Hook ==========
  const { gpsLoading, handleGpsLocation } = useLocation({
    onCityDetected: (cityName) => {
      setLocalCity(cityName);
      setShowCityPicker(false);
    },
  });

  // ========== 计算筛选条件数量 ==========
  // 位置筛选条件数
  const locationFilterCount = useMemo(() => {
    let count = 0;
    if (selectedLocation) count++;
    if (maxDistance) count++;
    return count;
  }, [selectedLocation, maxDistance]);

  // 价格/星级筛选条件数
  const priceFilterCount = useMemo(() => {
    let count = 0;
    if (minPrice || maxPrice) count++;
    if (localStarRating) count++;
    return count;
  }, [minPrice, maxPrice, localStarRating]);

  // 综合筛选条件数
  const generalFilterCount = useMemo(() => {
    let count = 0;
    if (hotTags.length) count += hotTags.length;
    if (accommodationType.length) count += accommodationType.length;
    if (hotelFeatures.length) count += hotelFeatures.length;
    if (roomFeatures.length) count += roomFeatures.length;
    if (facilities.length) count += facilities.length;
    if (brands.length) count += brands.length;
    return count;
  }, [hotTags, accommodationType, hotelFeatures, roomFeatures, facilities, brands]);

  // ========== 构建搜索参数 ==========
  const searchParams = useMemo(
    () => ({
      city: localCity || '上海',
      keyword: localKeyword.trim() || selectedLocation || undefined,
      starRating: localStarRating || undefined,
      minPrice: minPrice || undefined,
      maxPrice: maxPrice || undefined,
      sortBy: sortBy,
      // 综合筛选参数
      facilities: facilities.length > 0 ? facilities.join(',') : undefined,
      brands: brands.length > 0 ? brands.join(',') : undefined,
      hotelFeatures: hotelFeatures.length > 0 ? hotelFeatures.join(',') : undefined,
      roomFeatures: roomFeatures.length > 0 ? roomFeatures.join(',') : undefined,
      // hotTags 作为关键词搜索（如果没有其他关键词）
      tags: hotTags.length > 0 ? hotTags.join(',') : undefined,
      pageSize: PAGE_SIZE,
    }),
    [localCity, localKeyword, selectedLocation, localStarRating, minPrice, maxPrice, sortBy, facilities, brands, hotelFeatures, roomFeatures, hotTags]
  );

  // 使用 TanStack Query 的无限滚动 hook
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteHotelList(searchParams);

  // 扁平化分页数据
  const hotels = flattenHotelPages(data as { pages: HotelListResponse[] } | undefined);
  const total = getTotalFromPages(data as { pages: HotelListResponse[] } | undefined);

  // 日期计算
  const nights = Math.max(1, localCheckOut.diff(localCheckIn, 'day'));

  // ========== 事件处理 ==========
  const handleSearch = useCallback(() => {
    setKeyword(localKeyword);
  }, [localKeyword, setKeyword]);

  const handleScrollToLower = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleCardClick = useCallback((hotel: Hotel) => {
    addToRecentlyViewed(hotel);
    const queryString = toQueryString({
      id: hotel.id,
      checkIn: localCheckIn.format('YYYY-MM-DD'),
      checkOut: localCheckOut.format('YYYY-MM-DD'),
    });
    Taro.navigateTo({ url: `/pages/hotel-detail/index?${queryString}` });
  }, [addToRecentlyViewed, localCheckIn, localCheckOut]);

  const goBack = useCallback(() => {
    Taro.navigateBack().catch(() => {
      Taro.redirectTo({ url: '/pages/index/index' });
    });
  }, []);

  // 筛选标签点击
  const handleFilterTabClick = useCallback((key: string) => {
    if (key === 'smart') {
      setSortBy('smart');
      setActiveFilter(null);
    } else {
      setActiveFilter(activeFilter === key ? null : key);
      if (key !== 'filter') {
        setSortBy(key);
      }
    }
  }, [activeFilter]);

  // 快速标签点击
  const handleQuickTagClick = useCallback((tag: string) => {
    if (localKeyword === tag) {
      setLocalKeyword('');
      setKeyword('');
    } else {
      setLocalKeyword(tag);
      setKeyword(tag);
      // 添加到历史
      if (!historyTags.includes(tag)) {
        setHistoryTags(prev => [tag, ...prev.slice(0, 4)]);
      }
    }
  }, [localKeyword, setKeyword, historyTags]);

  // 位置筛选确认
  const handleLocationConfirm = useCallback(() => {
    setActiveFilter(null);
  }, []);

  // 位置筛选清空
  const handleLocationClear = useCallback(() => {
    setLocationCategory('hot');
    setSelectedLocation('');
    setMaxDistance(null);
  }, []);

  // 价格筛选确认
  const handlePriceConfirm = useCallback(() => {
    setActiveFilter(null);
  }, []);

  // 价格筛选清空
  const handlePriceClear = useCallback(() => {
    setMinPrice(null);
    setMaxPrice(null);
    setPriceRange(null);
    setLocalStarRating(null);
  }, []);

  // 综合筛选确认
  const handleGeneralConfirm = useCallback(() => {
    // 将选中的标签添加到历史筛选
    const allSelectedTags = [...hotTags, ...brands];
    if (allSelectedTags.length > 0) {
      setHistoryTags(prev => {
        const newTags = allSelectedTags.filter(tag => !prev.includes(tag));
        return [...newTags, ...prev].slice(0, 10); // 最多保存10个历史标签
      });
    }
    setActiveFilter(null);
  }, [hotTags, brands]);

  // 综合筛选清空
  const handleGeneralClear = useCallback(() => {
    setHotTags([]);
    setAccommodationType([]);
    setHotelFeatures([]);
    setRoomFeatures([]);
    setFacilities([]);
    setBrands([]);
  }, []);

  // 数组切换辅助函数
  const toggleArrayItem = useCallback((arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }, []);

  // ========== 快速筛选标签 ==========
  const quickTags = useMemo(() => {
    // 根据城市显示不同的快速标签
    const cityTags: Record<string, string[]> = {
      '上海': ['外滩', '迪士尼', '双床房', '含早餐', '近地铁'],
      '北京': ['天安门', '故宫', '双床房', '含早餐', '近地铁'],
      '广州': ['珠江新城', '天河', '双床房', '含早餐', '近地铁'],
      '深圳': ['福田', '南山', '双床房', '含早餐', '近地铁'],
      '杭州': ['西湖', '武林', '双床房', '含早餐', '近地铁'],
    };
    return cityTags[localCity] || ['双床房', '含早餐', '免费停车', '游泳池', '近地铁'];
  }, [localCity]);

  const apiBaseDebugText = isWeappDevtools ? `Debug: API_BASE=${getApiBaseCacheKey()}` : '';

  return (
    <View className="ctrip-list">
      {/* Header */}
      <View className="ctrip-list-header">
        <View className="ctrip-back-btn" onClick={goBack}>
          <Text className="back-arrow">‹</Text>
        </View>
        <View className="ctrip-list-search-box">
          <View className="search-box-row">
            <Text className="search-city clickable-hint" onClick={() => setShowCityPicker(true)}>
              {localCity} <Text className="hint-arrow">▼</Text>
            </Text>
            <Text className="search-dates clickable-hint" onClick={() => setShowDatePicker('checkIn')}>
              {localCheckIn.format('MM-DD')} - {localCheckOut.format('MM-DD')} <Text className="hint-arrow">▼</Text>
            </Text>
            <Text className="search-nights">{nights}晚</Text>
            <Text className="search-rooms clickable-hint" onClick={() => setShowRoomPicker(true)}>
              {rooms}间{adults}人 <Text className="hint-arrow">▼</Text>
            </Text>
          </View>
          <View className="search-box-input">
            <Text className="search-icon">🔍</Text>
            <Input
              className="search-input-inner"
              placeholder="位置/品牌/酒店"
              placeholderClass="search-placeholder"
              value={localKeyword}
              onInput={(e) => setLocalKeyword(e.detail.value)}
              onConfirm={handleSearch}
            />
          </View>
        </View>
        <View className="ctrip-list-map">
          <Text className="map-icon">📍</Text>
          <Text className="map-text">地图</Text>
        </View>
        <View className="ctrip-list-more-btn">
          <Text className="more-icon">•••</Text>
          <Text className="more-text">更多</Text>
        </View>
      </View>

      {/* Filters */}
      <FilterTabs
        activeFilter={activeFilter}
        sortBy={sortBy}
        locationFilterCount={locationFilterCount}
        priceFilterCount={priceFilterCount}
        generalFilterCount={generalFilterCount}
        quickTags={quickTags}
        localKeyword={localKeyword}
        onTabClick={handleFilterTabClick}
        onQuickTagClick={handleQuickTagClick}
      />

      {/* Content */}
      <HotelListContent
        hotels={hotels}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isWeappDevtools={isWeappDevtools}
        apiBaseDebugText={apiBaseDebugText}
        onScrollToLower={handleScrollToLower}
        onRetry={() => refetch()}
        onCardClick={handleCardClick}
      />

      {/* ========== 筛选弹窗 ========== */}
      
      {/* 位置距离筛选 */}
      <Popup
        visible={activeFilter === 'distance'}
        onClose={() => setActiveFilter(null)}
        position="top"
      >
        <LocationFilter
          city={localCity}
          selectedCategory={locationCategory}
          selectedLocation={selectedLocation}
          maxDistance={maxDistance}
          onCategoryChange={setLocationCategory}
          onLocationChange={setSelectedLocation}
          onDistanceChange={setMaxDistance}
          onConfirm={handleLocationConfirm}
          onClear={handleLocationClear}
        />
      </Popup>

      {/* 价格/星级筛选 */}
      <Popup
        visible={activeFilter === 'price'}
        onClose={() => setActiveFilter(null)}
        position="top"
      >
        <PriceFilter
          minPrice={minPrice}
          maxPrice={maxPrice}
          priceRange={priceRange}
          starRating={localStarRating}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
          onPriceRangeChange={setPriceRange}
          onStarRatingChange={setLocalStarRating}
          onConfirm={handlePriceConfirm}
          onClear={handlePriceClear}
        />
      </Popup>

      {/* 综合筛选 */}
      <Popup
        visible={activeFilter === 'filter'}
        onClose={() => setActiveFilter(null)}
        position="top"
      >
        <GeneralFilter
          historyTags={historyTags}
          hotTags={hotTags}
          accommodationType={accommodationType}
          hotelFeatures={hotelFeatures}
          roomFeatures={roomFeatures}
          facilities={facilities}
          brands={brands}
          onHotTagToggle={(tag) => setHotTags(prev => toggleArrayItem(prev, tag))}
          onAccommodationTypeToggle={(type) => setAccommodationType(prev => toggleArrayItem(prev, type))}
          onHotelFeatureToggle={(feature) => setHotelFeatures(prev => toggleArrayItem(prev, feature))}
          onRoomFeatureToggle={(feature) => setRoomFeatures(prev => toggleArrayItem(prev, feature))}
          onFacilityToggle={(facility) => setFacilities(prev => toggleArrayItem(prev, facility))}
          onBrandToggle={(brand) => setBrands(prev => toggleArrayItem(prev, brand))}
          onConfirm={handleGeneralConfirm}
          onClear={handleGeneralClear}
        />
      </Popup>

      {/* 城市选择弹窗 */}
      <Popup
        visible={showCityPicker}
        onClose={() => setShowCityPicker(false)}
        position="bottom"
        round
      >
        <View className="ctrip-picker-popup">
          <View className="picker-header">
            <Text className="picker-title">选择城市</Text>
            <View
              className={`picker-gps-btn ${gpsLoading ? 'loading' : ''}`}
              onClick={handleGpsLocation}
            >
              <Text className="gps-icon-text">{gpsLoading ? '...' : '◎'}</Text>
              <Text className="gps-label">定位</Text>
            </View>
            <Text className="picker-close" onClick={() => setShowCityPicker(false)}>×</Text>
          </View>
          <View className="picker-city-list">
            {POPULAR_CITIES.map((c) => (
              <Text
                key={c}
                className={`picker-city-item ${localCity === c ? 'active' : ''}`}
                onClick={() => {
                  setLocalCity(c);
                  setShowCityPicker(false);
                }}
              >
                {c}
              </Text>
            ))}
          </View>
        </View>
      </Popup>

      {/* 日期选择弹窗 */}
      <Popup
        visible={!!showDatePicker}
        onClose={() => setShowDatePicker(null)}
        position="bottom"
        round
      >
        <View className="ctrip-picker-popup ctrip-date-picker-popup">
          <View className="picker-header">
            <Text className="picker-title">选择{showDatePicker === 'checkIn' ? '入住' : '离店'}日期</Text>
            <Text className="picker-close" onClick={() => setShowDatePicker(null)}>×</Text>
          </View>
          <Calendar
            value={showDatePicker === 'checkIn' ? localCheckIn : localCheckOut}
            minDate={showDatePicker === 'checkIn' ? dayjs() : localCheckIn}
            onChange={(date: Dayjs) => {
              if (showDatePicker === 'checkIn') {
                setLocalCheckIn(date);
                if (date.isAfter(localCheckOut) || date.isSame(localCheckOut, 'day')) {
                  setLocalCheckOut(date.add(1, 'day'));
                }
                setShowDatePicker('checkOut');
              } else {
                setLocalCheckOut(date);
                setShowDatePicker(null);
              }
            }}
          />
        </View>
      </Popup>

      {/* 房间人数选择弹窗 */}
      <Popup
        visible={showRoomPicker}
        onClose={() => setShowRoomPicker(false)}
        position="bottom"
        round
      >
        <View className="ctrip-picker-popup ctrip-room-picker-popup">
          <View className="picker-header">
            <Text className="picker-title">选择房间与人数</Text>
            <Text className="picker-close" onClick={() => setShowRoomPicker(false)}>×</Text>
          </View>

          <View className="picker-room-row">
            <Text className="picker-room-label">房间</Text>
            <View className="picker-stepper">
              <Text className="stepper-btn" onClick={() => setRooms(Math.max(1, rooms - 1))}>-</Text>
              <Text className="stepper-value">{rooms}</Text>
              <Text className="stepper-btn" onClick={() => setRooms(Math.min(10, rooms + 1))}>+</Text>
            </View>
          </View>

          <View className="picker-room-row">
            <Text className="picker-room-label">成人</Text>
            <View className="picker-stepper">
              <Text className="stepper-btn" onClick={() => setAdults(Math.max(1, adults - 1))}>-</Text>
              <Text className="stepper-value">{adults}</Text>
              <Text className="stepper-btn" onClick={() => setAdults(Math.min(20, adults + 1))}>+</Text>
            </View>
          </View>

          <View className="picker-room-row">
            <Text className="picker-room-label">儿童</Text>
            <View className="picker-stepper">
              <Text className="stepper-btn" onClick={() => setChildren(Math.max(0, children - 1))}>-</Text>
              <Text className="stepper-value">{children}</Text>
              <Text className="stepper-btn" onClick={() => setChildren(Math.min(10, children + 1))}>+</Text>
            </View>
          </View>

          <View className="picker-room-confirm">
            <Text className="picker-confirm-btn" onClick={() => setShowRoomPicker(false)}>
              确定
            </Text>
          </View>
        </View>
      </Popup>
    </View>
  );
}
