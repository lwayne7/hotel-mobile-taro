import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Input, ScrollView, Image } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { publicHotelApi } from '../../services/api';
import type { Hotel } from '../../types/hotel';
import dayjs from 'dayjs';
import './index.scss';

const PAGE_SIZE = 10;
const SORT_OPTIONS = [
  { key: 'popular', label: '欢迎度排序' },
  { key: 'distance', label: '位置距离' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];
const QUICK_TAGS = ['外滩', '双床房', '含早餐', '免费兑早餐', '可订'];

function getReviewStats(hotel: Hotel) {
  const base = (hotel.id * 137) % 8000 + 1000;
  const reviews = base;
  const favorites = Math.floor(base * (1.2 + (hotel.id % 10) * 0.1));
  return { reviews, favorites: favorites >= 10000 ? (favorites / 10000).toFixed(1) + '万' : String(favorites) };
}

function getRatingLabel(score: number) {
  if (score >= 4.8) return '超棒';
  if (score >= 4.5) return '很棒';
  if (score >= 4.0) return '不错';
  return '好评';
}

export default function HotelList() {
  const router = useRouter();
  const params = router.params || {};
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [city, setCity] = useState(params.city || '上海');
  const [starRating, setStarRating] = useState(Number(params.starRating) || 0);
  const [sortBy, setSortBy] = useState('popular');
  const checkInParam = params.checkIn;
  const checkOutParam = params.checkOut;
  const checkIn = checkInParam ? dayjs(checkInParam) : dayjs();
  const checkOut = checkOutParam ? dayjs(checkOutParam) : dayjs().add(1, 'day');
  const nights = Math.max(1, checkOut.diff(checkIn, 'day'));
  const hasMore = list.length < total;

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      try {
        const reqParams: any = { page: pageNum, pageSize: PAGE_SIZE };
        if (keyword.trim()) reqParams.keyword = keyword.trim();
        if (city.trim()) reqParams.city = city.trim();
        if (starRating > 0) reqParams.starRating = starRating;
        const res = await publicHotelApi.getList(reqParams);
        if (append) {
          setList((prev) => [...prev, ...(res.data || [])]);
        } else {
          setList(res.data || []);
        }
        setTotal(res.total || 0);
        setPage(pageNum);
      } catch {
        if (!append) setList([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [keyword, city, starRating]
  );

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  const handleSearch = () => {
    loadPage(1, false);
  };

  const onScrollToLower = () => {
    if (loadingMore || !hasMore || list.length === 0) return;
    loadPage(page + 1, true);
  };

  const getMinPrice = (hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.price)).filter((n: number) => !Number.isNaN(n)) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

  const getOriginalPrice = (hotel: Hotel) => {
    const prices = hotel.roomTypes?.map((r: any) => Number(r?.originalPrice)).filter((n: number) => !Number.isNaN(n) && n > 0) || [];
    return prices.length ? Math.min(...prices) : 0;
  };

  const getTags = (hotel: Hotel) => {
    const tags: string[] = [];
    if (hotel.facilities?.length) tags.push(...hotel.facilities.slice(0, 4));
    if (tags.length === 0) tags.push('免费WiFi', '免费停车', '含早');
    return tags.slice(0, 4);
  };

  const getScore = (hotel: Hotel) => {
    const s = (hotel.id % 31) / 10 + 4.3;
    return Math.min(5, Math.round(s * 10) / 10);
  };

  const getNearbyText = (hotel: Hotel) => {
    const att = hotel.nearbyAttractions?.slice(0, 2).join('·') || hotel.address?.slice(0, 12) || '交通便利';
    return att.length > 20 ? att.slice(0, 20) + '…' : att;
  };

  const queryString = () => {
    const q = new URLSearchParams();
    if (params.keyword) q.set('keyword', params.keyword);
    if (params.city) q.set('city', params.city);
    if (params.checkIn) q.set('checkIn', params.checkIn);
    if (params.checkOut) q.set('checkOut', params.checkOut);
    if (params.starRating) q.set('starRating', params.starRating);
    return q.toString();
  };

  return (
    <View className="ctrip-list">
      <View className="ctrip-list-header">
        <Text className="ctrip-back-btn" onClick={() => Taro.navigateBack()}>‹ 返回</Text>
        <View className="ctrip-list-header-center">
          <Text className="ctrip-list-city">{city || '上海'}</Text>
          <Text className="ctrip-list-dates">
            住 {checkIn.format('MM-DD')} 离 {checkOut.format('MM-DD')} {nights}晚
          </Text>
        </View>
        <Text className="ctrip-list-map" onClick={() => Taro.showToast({ title: '地图', icon: 'none' })}>📍 地图</Text>
      </View>

      <View className="ctrip-list-search-row">
        <Input
          placeholder="位置/品牌/酒店"
          value={keyword}
          onInput={(e) => setKeyword(e.detail.value)}
          className="ctrip-list-search-input"
          onConfirm={handleSearch}
        />
      </View>

      <View className="ctrip-list-filters">
        {SORT_OPTIONS.map((opt) => (
          <Text
            key={opt.key}
            className={`ctrip-list-filter-item ${sortBy === opt.key ? 'active' : ''}`}
            onClick={() => setSortBy(opt.key)}
          >
            {opt.label}
          </Text>
        ))}
      </View>
      <View className="ctrip-list-quick-tags">
        {QUICK_TAGS.map((tag) => (
          <Text key={tag} className="ctrip-list-quick-tag">{tag}</Text>
        ))}
      </View>

      <ScrollView
        scrollY
        className="ctrip-list-scroll"
        onScrollToLower={onScrollToLower}
        lowerThreshold={80}
      >
        {loading ? (
          <View className="ctrip-list-loading">
            <Text>加载中...</Text>
          </View>
        ) : list.length === 0 ? (
          <View className="ctrip-empty">
            <Text>暂无酒店</Text>
          </View>
        ) : (
          <>
            {list.map((hotel) => {
              const minPrice = getMinPrice(hotel);
              const originalPrice = getOriginalPrice(hotel);
              const tags = getTags(hotel);
              const score = getScore(hotel);
              const { reviews, favorites } = getReviewStats(hotel);
              const nearbyText = getNearbyText(hotel);
              const qs = queryString();
              return (
                <View
                  key={hotel.id}
                  className="ctrip-list-card"
                  onClick={() => Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotel.id}${qs ? '&' + qs : ''}` })}
                >
                  <View className="ctrip-list-card-cover">
                    {hotel.images?.[0]?.imageUrl ? (
                      <Image src={hotel.images[0].imageUrl} mode="aspectFill" className="ctrip-list-card-img" />
                    ) : (
                      <View className="ctrip-list-card-placeholder" />
                    )}
                  </View>
                  <View className="ctrip-list-card-body">
                    <Text className="ctrip-list-card-name">{hotel.nameCn}</Text>
                    <View className="ctrip-list-card-meta">
                      <Text className="ctrip-list-card-stars">{'★'.repeat(hotel.starRating)}</Text>
                    </View>
                    <View className="ctrip-list-card-score">
                      <Text className="ctrip-list-card-score-num">{score}</Text>
                      <Text className="ctrip-list-card-score-label">{getRatingLabel(score)}</Text>
                      <Text className="ctrip-list-card-score-reviews">{reviews}点评·{favorites}收藏</Text>
                    </View>
                    <Text className="ctrip-list-card-nearby">近{nearbyText}</Text>
                    {hotel.description && (
                      <Text className="ctrip-list-card-highlight">
                        {hotel.description.slice(0, 36)}{hotel.description.length > 36 ? '…' : ''}
                      </Text>
                    )}
                    {tags.length > 0 && (
                      <View className="ctrip-list-card-tags">
                        {tags.map((t) => (
                          <Text key={t} className="ctrip-list-tag">{t}</Text>
                        ))}
                      </View>
                    )}
                    <View className="ctrip-list-card-price-row">
                      <View className="ctrip-list-card-price-wrap">
                        <Text className="ctrip-price-num">¥{minPrice}</Text>
                        <Text className="ctrip-price-suffix">起</Text>
                        {originalPrice > minPrice && (
                          <Text className="ctrip-list-card-original">¥{originalPrice}</Text>
                        )}
                        <Text className="ctrip-list-card-offers">钻石贵宾价 · 满减券</Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            {loadingMore && (
              <View className="ctrip-list-more">
                <Text>加载更多...</Text>
              </View>
            )}
            {!loadingMore && hasMore && list.length > 0 && (
              <View className="ctrip-list-more-hint">
                <Text>上滑加载更多</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
