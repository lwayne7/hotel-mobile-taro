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

// Parse price range string to minPrice/maxPrice
function parsePriceRange(range: string): { minPrice?: number; maxPrice?: number } {
  if (!range || range === '不限') return {};
  if (range === '¥150以下') return { maxPrice: 150 };
  if (range === '¥600以上') return { minPrice: 600 };
  const match = range.match(/¥(\d+)-(\d+)/);
  if (match) return { minPrice: Number(match[1]), maxPrice: Number(match[2]) };
  return {};
}

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
  const params = {
    city: decodeParam(rawParams.city) || rawParams.city || '',
    keyword: decodeParam(rawParams.keyword) || rawParams.keyword || '',
    checkIn: rawParams.checkIn,
    checkOut: rawParams.checkOut,
    starRating: rawParams.starRating,
    priceRange: decodeParam(rawParams.priceRange) || rawParams.priceRange || '',
  };
  const [list, setList] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState(params.keyword || '');
  const [city, setCity] = useState(params.city || '上海');
  const [starRating, setStarRating] = useState(Number(params.starRating) || 0);
  const [priceRange] = useState(params.priceRange || '');
  const [sortBy, setSortBy] = useState('popular');
  const checkInParam = params.checkIn;
  const checkOutParam = params.checkOut;
  const checkIn = checkInParam ? dayjs(checkInParam) : dayjs();
  const checkOut = checkOutParam ? dayjs(checkOutParam) : dayjs().add(1, 'day');
  const nights = Math.max(1, checkOut.diff(checkIn, 'day'));
  const hasMore = list.length < total;

  // Parse price range once
  const { minPrice, maxPrice } = parsePriceRange(priceRange);

  const loadPage = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setLoadError(null);
      try {
        const reqParams: any = { page: pageNum, pageSize: PAGE_SIZE };
        if (keyword.trim()) reqParams.keyword = keyword.trim();
        if (city.trim()) reqParams.city = city.trim();
        if (starRating > 0) reqParams.starRating = starRating;
        if (minPrice !== undefined) reqParams.minPrice = minPrice;
        if (maxPrice !== undefined) reqParams.maxPrice = maxPrice;
        const res = await publicHotelApi.getList(reqParams);
        if (append) {
          setList((prev) => [...prev, ...(res.data || [])]);
        } else {
          setList(res.data || []);
        }
        setTotal(res.total || 0);
        setPage(pageNum);
      } catch (err) {
        if (!append) {
          setList([]);
          setLoadError(err instanceof Error ? err.message : '加载失败，请检查网络或稍后重试');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [keyword, city, starRating, minPrice, maxPrice]
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
    if (keyword.trim()) q.set('keyword', keyword.trim());
    if (city.trim()) q.set('city', city.trim());
    if (checkInParam) q.set('checkIn', checkInParam);
    if (checkOutParam) q.set('checkOut', checkOutParam);
    if (starRating > 0) q.set('starRating', String(starRating));
    if (priceRange) q.set('priceRange', priceRange);
    return q.toString();
  };

  return (
    <View className="ctrip-list">
      {/* Header with integrated search box */}
      <View className="ctrip-list-header">
        <View className="ctrip-back-btn" onClick={() => Taro.navigateBack()}>
          <Text className="back-arrow">‹</Text>
        </View>
        <View className="ctrip-list-search-box">
          <View className="search-city-pill">
            <Text className="search-city-text">{city || '上海'}</Text>
          </View>
          <View className="search-divider" />
          <View className="search-dates">
            <Text className="date-label">住</Text>
            <Text className="date-val">{checkIn.format('MM-DD')}</Text>
            <Text className="date-sep"> </Text>
            <Text className="date-label">离</Text>
            <Text className="date-val">{checkOut.format('MM-DD')}</Text>
            <Text className="date-nights">共{nights}晚</Text>
          </View>
          <View className="search-input-wrap">
            <Text className="search-icon">🔍</Text>
            <Input
              placeholder="位置/品牌/酒店"
              value={keyword}
              onInput={(e) => setKeyword(e.detail.value)}
              className="search-input-inner"
              onConfirm={handleSearch}
            />
          </View>
        </View>
        <View className="ctrip-list-map" onClick={() => Taro.showToast({ title: '地图', icon: 'none' })}>
          <Text className="map-icon">📍</Text>
          <Text className="map-text">地图</Text>
        </View>
      </View>

      <View className="ctrip-list-filters">
        <View className="filter-row-main">
          {SORT_OPTIONS.map((opt) => (
            <View
              key={opt.key}
              className={`ctrip-filter-item ${sortBy === opt.key ? 'active' : ''}`}
              onClick={() => setSortBy(opt.key)}
            >
              <Text>{opt.label}</Text>
              <Text className="filter-arrow">▼</Text>
            </View>
          ))}
        </View>
        <ScrollView scrollX className="filter-row-quick">
          {QUICK_TAGS.map((tag) => (
            <Text key={tag} className="ctrip-quick-filter-tag">{tag}</Text>
          ))}
        </ScrollView>
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
        ) : loadError ? (
          <View className="ctrip-empty">
            <Text className="ctrip-empty-msg">{loadError}</Text>
            <Text className="ctrip-empty-hint">请确认已启动后端：cd hotel-management/backend && npm run start:dev</Text>
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
                    {/* Video play icon simulation */}
                    <View className="card-video-icon">
                      <Text className="card-video-triangle">▶</Text>
                    </View>
                  </View>
                  <View className="ctrip-list-card-body">
                    <View className="card-top-row">
                      <Text className="ctrip-list-card-name">{hotel.nameCn}</Text>
                      {hotel.starRating >= 5 ? (
                        <Text className="card-star-diamond">💎💎💎💎💎</Text>
                      ) : (
                        <Text className="card-stars">{'★'.repeat(hotel.starRating)}</Text>
                      )}
                    </View>

                    <View className="ctrip-list-card-score-row">
                      <View className="score-badge">
                        <Text className="score-num">{score}</Text>
                        <Text className="score-txt">{getRatingLabel(score)}</Text>
                      </View>
                      <Text className="review-count">{reviews}点评 · {favorites}收藏 · "{getRatingLabel(score)}推荐"</Text>
                    </View>

                    <Text className="ctrip-list-card-nearby">{nearbyText}</Text>

                    <View className="ctrip-list-card-tags">
                      <Text className="ctrip-tag-boss">BOSS推荐</Text>
                      {tags.slice(0, 2).map((t) => (
                        <Text key={t} className="ctrip-list-tag">{t}</Text>
                      ))}
                    </View>

                    <View className="ctrip-list-card-price-row">
                      <View className="ctrip-list-card-price-wrap">
                        <View className="price-main">
                          <Text className="currency">¥</Text>
                          <Text className="amount">{minPrice}</Text>
                          <Text className="suffix">起</Text>
                        </View>
                        {originalPrice > minPrice && (
                          <View className="price-bottom">
                            <Text className="diamond-price">钻石贵宾价</Text>
                            <Text className="price-del">¥{originalPrice}</Text>
                          </View>
                        )}
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
