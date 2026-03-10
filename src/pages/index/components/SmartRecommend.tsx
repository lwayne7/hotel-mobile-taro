/**
 * 智能推荐组件
 * 基于用户浏览历史中的星级偏好和价格偏好，推荐相似酒店
 */
import { useState, useEffect, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useHotelStore } from '../../../store/useHotelStore';
import { useSearchStore } from '../../../store/useSearchStore';
import { publicHotelApi } from '../../../services/api';
import { HotelCard } from '../../../components/ui';
import type { Hotel } from '../../../types/hotel';

export function SmartRecommend() {
    const recentlyViewed = useHotelStore((s) => s.recentlyViewed);
    const city = useSearchStore((s) => s.city) || '上海';
    const addToRecentlyViewed = useHotelStore((s) => s.addToRecentlyViewed);
    const [recommendations, setRecommendations] = useState<Hotel[]>([]);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (recentlyViewed.length < 2) return;

        const viewedIds = new Set(recentlyViewed.map((h) => h.id));

        // Compute user preferences from browsing history
        const avgStar = Math.round(
            recentlyViewed.reduce((sum, h) => sum + (h.starRating || 3), 0) / recentlyViewed.length,
        );
        const prices = recentlyViewed.reduce<number[]>((acc, h) => {
            const roomPrices = (h.roomTypes || []).map((r) => Number(r.price)).filter((p) => p > 0);
            return acc.concat(roomPrices);
        }, []);
        const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 300;

        setReason(`基于您偏好的${avgStar}星级、¥${avgPrice}左右的酒店`);

        let cancelled = false;
        setLoading(true);
        publicHotelApi
            .getList({
                city,
                starRating: avgStar,
                minPrice: Math.max(0, avgPrice - 150),
                maxPrice: avgPrice + 150,
                page: 1,
                pageSize: 6,
            })
            .then((res) => {
                if (cancelled) return;
                const filtered = (res.data || []).filter((h) => !viewedIds.has(h.id));
                setRecommendations(filtered.slice(0, 4));
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [recentlyViewed, city]);

    const handleClick = useCallback((hotel: Hotel) => {
        addToRecentlyViewed(hotel);
        Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotel.id}` });
    }, [addToRecentlyViewed]);

    if (recentlyViewed.length < 2 || (!loading && recommendations.length === 0)) return null;

    return (
        <View className="smart-recommend-section">
            <Text className="smart-recommend-title">猜你喜欢</Text>
            {reason && <Text className="smart-recommend-reason">{reason}</Text>}
            {loading ? (
                <Text style={{ fontSize: '13px', color: '#999' }}>推荐加载中...</Text>
            ) : (
                recommendations.map((hotel) => (
                    <HotelCard key={hotel.id} hotel={hotel} onClick={() => handleClick(hotel)} />
                ))
            )}
        </View>
    );
}
