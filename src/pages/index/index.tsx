/**
 * 首页 - 重构版本
 * 
 * 架构优化：
 * 1. 拆分为独立组件：SearchCard, HotCities, RecommendSection
 * 2. 使用 Zustand 选择器避免不必要的重渲染
 * 3. 页面显示时重置滚动位置
 */
import { useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useSearch } from '../../hooks/useSearch';
import { useHotelList } from '../../hooks/useHotels';
import { useSearchStore } from '../../store/useSearchStore';
import { SearchCard, HotCities, RecommendSection, RecentlyViewed } from './components';
import { platform } from '../../styles/rn-utils';
import './index.scss';

export default function Index() {
  const { navigateToList, navigateToListWithKeyword, navigateToDetail } = useSearch();

  // 获取当前选择的城市
  const city = useSearchStore((s) => s.city);

  // TanStack Query - 获取当前城市的酒店用于广告Banner
  const { data: cityHotelData } = useHotelList({
    city: city || undefined,
    page: 1,
    pageSize: 1,
  });
  const bannerHotel = cityHotelData?.data?.[0];

  // TanStack Query - 推荐酒店（不限城市）
  const {
    data: bannerData,
    isLoading: bannersLoading,
    isError: bannersError,
    error: bannerError,
    refetch: refetchBanners
  } = useHotelList({
    page: 1,
    pageSize: 5,
  });
  const bannerHotels = bannerData?.data || [];

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
          {/* H5端显示标题，小程序端使用导航栏 */}
          {platform.isH5 && (
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
          )}

          {/* 酒店广告Banner - 点击跳转当前城市酒店 */}
          <View
            className="hotel-ad-banner"
            onClick={() => bannerHotel && handleHotelClick(bannerHotel.id)}
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
              hotels={bannerHotels}
              isLoading={bannersLoading}
              isError={bannersError}
              error={bannerError}
              onRetry={refetchBanners}
              onHotelClick={handleHotelClick}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
