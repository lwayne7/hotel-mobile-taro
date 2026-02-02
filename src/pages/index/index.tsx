/**
 * 首页 - 重构版本
 * 
 * 架构优化：
 * 1. 拆分为独立组件：SearchCard, HotCities, RecommendSection
 * 2. 使用 Zustand 选择器避免不必要的重渲染
 * 3. 页面显示时重置滚动位置
 */
import { useState, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { useDidShow } from '@tarojs/taro';
import { useSearch } from '../../hooks/useSearch';
import { useHotelList } from '../../hooks/useHotels';
import { SearchCard, HotCities, RecommendSection } from './components';
import './index.scss';

export default function Index() {
  const { navigateToList, navigateToDetail } = useSearch();

  // TanStack Query - 推荐酒店
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

  // 滚动位置状态
  const [scrollTop, setScrollTop] = useState(0);

  // 页面显示时重置滚动位置到顶部
  useDidShow(() => {
    setScrollTop(0);
    setTimeout(() => setScrollTop(0), 50);
  });

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
        scrollTop={scrollTop}
        scrollWithAnimation={false}
      >
        <View className="ctrip-search">
          {/* H5端显示标题，小程序端使用导航栏 */}
          {process.env.TARO_ENV === 'h5' && (
            <View className="ctrip-header-title">易宿·酒店预订</View>
          )}

          <View className="ctrip-img-card">
            <View
              className="ctrip-img-banner"
              onClick={() => bannerHotels[0] && navigateToDetail(bannerHotels[0].id)}
              style={{ cursor: bannerHotels[0] ? 'pointer' : 'default' }}
            >
              <View className="banner-title-row">
                <Text className="banner-big-text">酒店7折起</Text>
                <Text className="banner-sub">大促</Text>
                <View className="banner-tags">
                  <Text className="banner-tag trans">官方补贴</Text>
                  <Text className="banner-tag trans">资质说明</Text>
                </View>
              </View>
            </View>

            <SearchCard onSearch={handleSearch} />
          </View>

          {/* 热门城市 */}
          <HotCities />

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
