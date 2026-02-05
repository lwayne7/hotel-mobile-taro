/** 首页：搜索卡片、热门城市、推荐酒店（按当前城市） */
import { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useSearch } from '../../hooks/useSearch';
import { useHotelList, useIsWeapp } from '../../hooks';
import { useSearchStore } from '../../store/useSearchStore';
import { SearchCard, HotCities, RecommendSection, RecentlyViewed } from './components';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../types/hotel';
import './index.scss';

export default function Index() {
  const { navigateToList, navigateToListWithKeyword, navigateToDetail } = useSearch();

  const city = useSearchStore((s) => s.city);
  const cityForRecommend = city?.trim() || '上海';
  const isWeapp = useIsWeapp();

  const [weappBannerHotel, setWeappBannerHotel] = useState<Hotel | undefined>(undefined);
  const [weappBannerHotels, setWeappBannerHotels] = useState<Hotel[]>([]);
  const [weappLoading, setWeappLoading] = useState(false);
  const [weappError, setWeappError] = useState<Error | null>(null);
  const [weappRefreshKey, setWeappRefreshKey] = useState(0);

  useEffect(() => {
    if (!isWeapp) return;
    let cancelled = false;
    const currentCity = cityForRecommend;
    
    const fetchData = async () => {
      setWeappLoading(true);
      setWeappError(null);
      try {
        const [cityRes, recommendRes] = await Promise.all([
          publicHotelApi.getList({ city: currentCity, page: 1, pageSize: 1 }),
          publicHotelApi.getList({ city: currentCity, page: 1, pageSize: 5 }),
        ]);
        if (cancelled) return;
        setWeappBannerHotel(cityRes.data?.[0]);
        setWeappBannerHotels(recommendRes.data || []);
      } catch (e: unknown) {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String((e as { message?: string })?.message ?? e));
        setWeappError(err);
        setWeappBannerHotel(undefined);
        setWeappBannerHotels([]);
      } finally {
        if (!cancelled) {
          setWeappLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, [cityForRecommend, isWeapp, weappRefreshKey]);

  const triggerWeappRefresh = useCallback(() => {
    if (!isWeapp) return;
    setWeappRefreshKey(k => k + 1);
  }, [isWeapp]);

  const { data: cityHotelData, refetch: refetchCityHotel } = useHotelList({
    city: cityForRecommend,
    page: 1,
    pageSize: 1,
  }, { enabled: !isWeapp });
  const bannerHotel = cityHotelData?.data?.[0];
  const currentBannerHotel = isWeapp ? weappBannerHotel : bannerHotel;

  const {
    data: bannerData,
    isLoading: bannersLoading,
    isError: bannersError,
    error: bannerError,
    refetch: refetchBanners
  } = useHotelList({
    city: cityForRecommend,
    page: 1,
    pageSize: 5,
  }, { enabled: !isWeapp });
  const bannerHotels = bannerData?.data || [];

  useDidShow(() => {
    if (isWeapp) {
      triggerWeappRefresh();
      return;
    }
    refetchCityHotel();
    refetchBanners();
  });

  useEffect(() => {
    if (isWeapp) return;
    refetchCityHotel();
    refetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityForRecommend]);

  const handleSearch = useCallback(() => {
    navigateToList();
  }, [navigateToList]);

  const handleHotelClick = useCallback((id: number) => {
    navigateToDetail(id);
  }, [navigateToDetail]);

  return (
    <View className="page-search">
      <ScrollView
        scrollY
        className="ctrip-search-scroll"
        scrollWithAnimation={false}
      >
        <View className="ctrip-search">
          {/* 顶部标题：默认在所有端显示，让小程序 / APP 视觉与 H5 更一致 */}
          <View className="ctrip-header-row">
            <Text className="ctrip-header-title">易宿·酒店预订</Text>
            <View
              className="ctrip-header-fav"
              onClick={() => Taro.navigateTo({ url: '/pages/favorites/index' })}
            >
              <Text className="fav-icon">💝</Text>
              <Text className="fav-text">收藏</Text>
            </View>
          </View>

          {/* 酒店广告Banner - 点击跳转当前城市酒店 */}
          <View
            className="hotel-ad-banner"
            onClick={() => currentBannerHotel && handleHotelClick(currentBannerHotel.id)}
          >
            <View className="ad-banner-left">
              <Text className="ad-banner-tag">资质说明</Text>
              <View className="ad-banner-headline">
                <Text className="ad-banner-text-hotel">酒店</Text>
                <Text className="ad-banner-text-discount">7折</Text>
                <Text className="ad-banner-text-suffix">起</Text>
              </View>
            </View>
            <View className="ad-banner-right">
              <Text className="ad-banner-label">宠物友好酒店</Text>
              <Text className="ad-banner-mascot">🐕</Text>
            </View>
          </View>

          {/* 搜索卡片 */}
          <View className="ctrip-search-card-wrapper">
            <SearchCard onSearch={handleSearch} onQuickTagSearch={navigateToListWithKeyword} />
          </View>

          {/* 热门城市 */}
          <HotCities />

          {/* 最近浏览 */}
          <RecentlyViewed />

          {/* 推荐酒店 */}
          <View className="ctrip-section">
            <Text className="ctrip-section-title">推荐酒店</Text>
            <RecommendSection
              hotels={isWeapp ? weappBannerHotels : bannerHotels}
              isLoading={isWeapp ? weappLoading : bannersLoading}
              isError={isWeapp ? !!weappError : bannersError}
              error={isWeapp ? weappError : bannerError}
              onRetry={isWeapp ? triggerWeappRefresh : refetchBanners}
              onHotelClick={handleHotelClick}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
