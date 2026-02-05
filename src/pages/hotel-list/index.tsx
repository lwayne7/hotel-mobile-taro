/** 酒店列表页：筛选、排序、无限滚动 */
import { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';

const HISTORY_TAGS_STORAGE_KEY = 'hotel_filter_history_tags';
import { useInfiniteHotelList, flattenHotelPages, getTotalFromPages, useIsWeapp } from '../../hooks';
import { useLocation } from '../../hooks/useLocation';
import { useSearchStore } from '../../store/useSearchStore';
import { useHotelStore } from '../../store/useHotelStore';
import { Popup } from '../../components/ui';
import Calendar from '../../components/Calendar';
import { POPULAR_CITIES, ALL_CITIES } from '../../constants/cities';
import { LocationFilter, PriceFilter, GeneralFilter } from './components';
import { FilterTabs } from './components/FilterTabs';
import { HotelListContent } from './components/HotelListContent';
import { publicHotelApi } from '../../services/api';
import type { Hotel, HotelListResponse } from '../../types/hotel';
import { toQueryString } from '../../utils/queryString';
import { getApiBaseCacheKey, isWeappDevtoolsRuntime } from '../../services/request';
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
  const isWeapp = useIsWeapp();
  const isWeappDevtools = useMemo(() => isWeapp && isWeappDevtoolsRuntime(), [isWeapp]);

  // Zustand - 使用选择器
  const city = useSearchStore((s) => s.city);
  const keyword = useSearchStore((s) => s.keyword);
  const starRating = useSearchStore((s) => s.starRating);
  const storeMinPrice = useSearchStore((s) => s.minPrice);
  const storeMaxPrice = useSearchStore((s) => s.maxPrice);
  const storeCheckIn = useSearchStore((s) => s.checkIn);
  const storeCheckOut = useSearchStore((s) => s.checkOut);
  const setKeyword = useSearchStore((s) => s.setKeyword);
  const setCity = useSearchStore((s) => s.setCity);
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

  // 本地筛选参数（与 store 同步：列表页选中的城市即“当前查询页城市”，回首页后推荐酒店按此城市）
  const [localCity, setLocalCity] = useState(decodeParam(rawParams.city) || city || '上海');
  useEffect(() => {
    setCity(localCity);
  }, [localCity, setCity]);
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
      setCity(cityName);
      setShowCityPicker(false);
    },
  });

  const locationFilterCount = (selectedLocation ? 1 : 0) + (maxDistance != null ? 1 : 0);
  const priceFilterCount = (minPrice != null || maxPrice != null ? 1 : 0) + (localStarRating != null ? 1 : 0);
  const generalFilterCount =
    hotTags.length + accommodationType.length + hotelFeatures.length +
    roomFeatures.length + facilities.length + brands.length;

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
    data: queryData,
    isLoading: queryIsLoading,
    isError: queryIsError,
    error: queryError,
    status: queryStatus,
    fetchStatus: queryFetchStatus,
    fetchNextPage: queryFetchNextPage,
    hasNextPage: queryHasNextPage,
    isFetchingNextPage: queryIsFetchingNextPage,
    refetch: queryRefetch,
  } = useInfiniteHotelList(searchParams, { enabled: !isWeapp });

  // weapp 最简兜底：不依赖 TanStack Query，避免小程序环境下 Query 不触发导致“不发请求、一直空列表”
  const [weappHotels, setWeappHotels] = useState<Hotel[]>([]);
  const [weappTotal, setWeappTotal] = useState(0);
  const [weappPage, setWeappPage] = useState(1);
  const [weappTotalPages, setWeappTotalPages] = useState(0);
  const [weappLoading, setWeappLoading] = useState(false);
  const [weappError, setWeappError] = useState<Error | null>(null);
  const [weappFetchingNextPage, setWeappFetchingNextPage] = useState(false);
  const [weappRefreshKey, setWeappRefreshKey] = useState(0);

  const triggerWeappRefresh = useCallback(() => {
    if (!isWeapp) return;
    setWeappRefreshKey((k) => k + 1);
  }, [isWeapp]);

  const fetchWeappFirstPage = useCallback(async () => {
    if (!isWeapp) return;
    setWeappLoading(true);
    setWeappError(null);
    try {
      const res = await publicHotelApi.getList({
        ...searchParams,
        page: 1,
        pageSize: PAGE_SIZE,
      });
      setWeappHotels(res.data || []);
      setWeappTotal(res.total || 0);
      setWeappPage(res.page || 1);
      setWeappTotalPages(res.totalPages || 0);
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(String(e?.message || e));
      setWeappError(err);
      setWeappHotels([]);
      setWeappTotal(0);
      setWeappPage(1);
      setWeappTotalPages(0);
    } finally {
      setWeappLoading(false);
    }
  }, [isWeapp, searchParams]);

  const fetchWeappNextPage = useCallback(async () => {
    if (!isWeapp) return;
    if (weappFetchingNextPage || weappLoading) return;
    if (weappTotalPages && weappPage >= weappTotalPages) return;

    const nextPage = weappPage + 1;
    setWeappFetchingNextPage(true);
    setWeappError(null);
    try {
      const res = await publicHotelApi.getList({
        ...searchParams,
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      setWeappHotels((prev) => prev.concat(res.data || []));
      setWeappTotal(res.total || weappTotal);
      setWeappPage(res.page || nextPage);
      setWeappTotalPages(res.totalPages || weappTotalPages);
    } catch (e: any) {
      const err = e instanceof Error ? e : new Error(String(e?.message || e));
      setWeappError(err);
      try {
        Taro.showToast({ title: err.message || '加载失败', icon: 'none' });
      } catch {
        // ignore
      }
    } finally {
      setWeappFetchingNextPage(false);
    }
  }, [
    isWeapp,
    searchParams,
    weappFetchingNextPage,
    weappLoading,
    weappPage,
    weappTotal,
    weappTotalPages,
  ]);

  // weapp：显式触发刷新时拉取第一页
  useEffect(() => {
    if (!isWeapp) return;
    if (weappRefreshKey === 0) return;
    fetchWeappFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeapp, weappRefreshKey]);

  // 扁平化分页数据
  const queryHotels = flattenHotelPages(queryData as { pages: HotelListResponse[] } | undefined);
  const queryTotal = getTotalFromPages(queryData as { pages: HotelListResponse[] } | undefined);
  const hotels = isWeapp ? weappHotels : queryHotels;
  const total = isWeapp ? weappTotal : queryTotal;
  const isLoading = isWeapp ? weappLoading && hotels.length === 0 : queryIsLoading;
  const isError = isWeapp ? !!weappError && hotels.length === 0 : queryIsError;
  const errorMessage = isWeapp ? weappError?.message : queryError?.message;
  const hasNextPage = isWeapp ? (weappTotalPages ? weappPage < weappTotalPages : false) : queryHasNextPage;
  const isFetchingNextPage = isWeapp ? weappFetchingNextPage : queryIsFetchingNextPage;

  // 日期计算
  const nights = Math.max(1, localCheckOut.diff(localCheckIn, 'day'));

  // ========== 事件处理 ==========
  const handleSearch = useCallback(() => {
    setKeyword(localKeyword);
    // localKeyword 未变化时也允许手动刷新，避免缓存导致“明明后端有数据但列表一直空”
    if (isWeapp) {
      triggerWeappRefresh();
      return;
    }
    queryRefetch();
  }, [isWeapp, localKeyword, queryRefetch, setKeyword, triggerWeappRefresh]);

  const handleScrollToLower = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    if (isWeapp) {
      fetchWeappNextPage();
      return;
    }
    queryFetchNextPage();
  }, [fetchWeappNextPage, hasNextPage, isFetchingNextPage, isWeapp, queryFetchNextPage]);

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
      if (isWeapp) triggerWeappRefresh();
    } else {
      setActiveFilter(activeFilter === key ? null : key);
      if (key !== 'filter') {
        setSortBy(key);
        if (isWeapp) triggerWeappRefresh();
      }
    }
  }, [activeFilter, isWeapp, triggerWeappRefresh]);

  // 快速标签点击
  const handleQuickTagClick = useCallback((tag: string) => {
    if (localKeyword === tag) {
      setLocalKeyword('');
      setKeyword('');
      if (isWeapp) triggerWeappRefresh();
    } else {
      setLocalKeyword(tag);
      setKeyword(tag);
      // 添加到历史
      if (!historyTags.includes(tag)) {
        setHistoryTags(prev => [tag, ...prev.slice(0, 4)]);
      }
      if (isWeapp) triggerWeappRefresh();
    }
  }, [historyTags, isWeapp, localKeyword, setKeyword, triggerWeappRefresh]);

  // 位置筛选确认
  const handleLocationConfirm = useCallback(() => {
    setActiveFilter(null);
    if (isWeapp) triggerWeappRefresh();
  }, [isWeapp, triggerWeappRefresh]);

  // 位置筛选清空
  const handleLocationClear = useCallback(() => {
    setLocationCategory('hot');
    setSelectedLocation('');
    setMaxDistance(null);
    if (isWeapp) triggerWeappRefresh();
  }, [isWeapp, triggerWeappRefresh]);

  // 价格筛选确认
  const handlePriceConfirm = useCallback(() => {
    setActiveFilter(null);
    if (isWeapp) triggerWeappRefresh();
  }, [isWeapp, triggerWeappRefresh]);

  // 价格筛选清空
  const handlePriceClear = useCallback(() => {
    setMinPrice(null);
    setMaxPrice(null);
    setPriceRange(null);
    setLocalStarRating(null);
    if (isWeapp) triggerWeappRefresh();
  }, [isWeapp, triggerWeappRefresh]);

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
    if (isWeapp) triggerWeappRefresh();
  }, [brands, hotTags, isWeapp, triggerWeappRefresh]);

  // 综合筛选清空
  const handleGeneralClear = useCallback(() => {
    setHotTags([]);
    setAccommodationType([]);
    setHotelFeatures([]);
    setRoomFeatures([]);
    setFacilities([]);
    setBrands([]);
    if (isWeapp) triggerWeappRefresh();
  }, [isWeapp, triggerWeappRefresh]);

  // 数组切换辅助函数
  const toggleArrayItem = useCallback((arr: string[], item: string) => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  }, []);

  // 快速筛选标签（与种子数据设施/房型匹配）
  const quickTags = useMemo(() => {
    const byCity: Record<string, string[]> = {
      '上海': ['外滩', '迪士尼', '双床房', '含早餐', '近地铁'],
      '北京': ['天安门', '故宫', '双床房', '含早餐', '近地铁'],
      '广州': ['珠江新城', '天河', '双床房', '含早餐', '近地铁'],
      '深圳': ['福田', '南山', '双床房', '含早餐', '近地铁'],
      '杭州': ['西湖', '武林', '双床房', '含早餐', '近地铁'],
      '成都': ['春熙路', '双床房', '含早餐', '近地铁'],
      '重庆': ['解放碑', '双床房', '含早餐', '近地铁'],
      '西安': ['大雁塔', '双床房', '含早餐', '近地铁'],
      '三亚': ['亚龙湾', '海景', '双床房', '含早餐'],
      '厦门': ['鼓浪屿', '双床房', '含早餐', '近地铁'],
    };
    return byCity[localCity] ?? ['双床房', '含早餐', '免费停车', '游泳池', '近地铁'];
  }, [localCity]);

  // 小程序页面“显示”时强制拉取一次，避免 DevTools/HMR/缓存导致“后端有数据但页面一直空”
  useDidShow(() => {
    if (isWeapp) {
      triggerWeappRefresh();
      return;
    }
    queryRefetch();
  });

  const apiBaseDebugText = isWeappDevtools
    ? `Debug: API_BASE=${getApiBaseCacheKey()} | mode=${isWeapp ? 'manual' : 'rq'} | status=${
        isWeapp ? (weappLoading ? 'loading' : weappError ? 'error' : 'success') : queryStatus
      } | fetchStatus=${isWeapp ? (weappLoading || weappFetchingNextPage ? 'fetching' : 'idle') : queryFetchStatus}`
    : '';

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
        errorMessage={errorMessage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        isWeappDevtools={isWeappDevtools}
        apiBaseDebugText={apiBaseDebugText}
        onScrollToLower={handleScrollToLower}
        onRetry={() => (isWeapp ? triggerWeappRefresh() : queryRefetch())}
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

      {/* 城市选择弹窗（与种子数据 50 城对齐） */}
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
            <Text className="picker-city-section-label">热门</Text>
            {POPULAR_CITIES.map((c) => (
              <Text
                key={c}
                className={`picker-city-item ${localCity === c ? 'active' : ''}`}
                onClick={() => {
                  setLocalCity(c);
                  setCity(c);
                  setShowCityPicker(false);
                }}
              >
                {c}
              </Text>
            ))}
            <Text className="picker-city-section-label">全部</Text>
            {ALL_CITIES.filter((c) => !POPULAR_CITIES.includes(c)).map((c) => (
              <Text
                key={c}
                className={`picker-city-item ${localCity === c ? 'active' : ''}`}
                onClick={() => {
                  setLocalCity(c);
                  setCity(c);
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
