/**
 * 收藏列表页
 * 展示用户收藏的酒店
 */
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState, useCallback } from 'react';
import { useHotelStore } from '../../store/useHotelStore';
import { useHotelDetail } from '../../hooks/useHotels';
import { HotelCard } from '../../components/ui';
import { useSearchStore } from '../../store/useSearchStore';
import dayjs from 'dayjs';
import type { Hotel } from '../../types/hotel';
import './index.scss';

// 单个收藏酒店项组件
function FavoriteItem({ hotelId, onRemove, onView }: {
    hotelId: number;
    onRemove: (id: number) => void;
    onView: (hotel: Hotel) => void;
}) {
    const { data: hotel, isLoading, isError } = useHotelDetail(hotelId);
    const checkIn = useSearchStore((s) => s.checkIn);
    const checkOut = useSearchStore((s) => s.checkOut);
    const nights = dayjs(checkOut).diff(dayjs(checkIn), 'day') || 1;

    if (isLoading) {
        return (
            <View className="favorite-item-skeleton">
                <View className="skeleton-image" />
                <View className="skeleton-content">
                    <View className="skeleton-line" />
                    <View className="skeleton-line short" />
                </View>
            </View>
        );
    }

    if (isError || !hotel) {
        return (
            <View className="favorite-item-error">
                <Text className="error-text">加载失败</Text>
                <Text className="remove-btn" onClick={() => onRemove(hotelId)}>移除</Text>
            </View>
        );
    }

    return (
        <View className="favorite-item">
            <HotelCard
                hotel={hotel}
                nights={nights}
                onClick={() => onView(hotel)}
            />
            <View className="favorite-actions">
                <Text className="action-btn remove" onClick={() => onRemove(hotelId)}>
                    取消收藏
                </Text>
            </View>
        </View>
    );
}

export default function FavoritesPage() {
    const favoriteIds = useHotelStore((s) => s.favoriteIds);
    const toggleFavorite = useHotelStore((s) => s.toggleFavorite);
    const addToRecentlyViewed = useHotelStore((s) => s.addToRecentlyViewed);
    const [scrollTop, setScrollTop] = useState(0);

    // 页面显示时重置滚动位置
    useDidShow(() => {
        setScrollTop(0);
        setTimeout(() => setScrollTop(0), 50);
    });

    const handleRemove = useCallback((hotelId: number) => {
        Taro.showModal({
            title: '确认取消收藏',
            content: '确定要取消收藏该酒店吗？',
            success: (res) => {
                if (res.confirm) {
                    toggleFavorite(hotelId);
                    Taro.showToast({ title: '已取消收藏', icon: 'none' });
                }
            }
        });
    }, [toggleFavorite]);

    const handleView = useCallback((hotel: Hotel) => {
        addToRecentlyViewed(hotel);
        Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotel.id}` });
    }, [addToRecentlyViewed]);

    const handleGoBack = () => {
        Taro.navigateBack();
    };

    return (
        <View className="favorites-page">
            {/* Header */}
            <View className="favorites-header">
                <View className="back-btn" onClick={handleGoBack}>
                    <Text className="back-arrow">‹</Text>
                </View>
                <Text className="header-title">我的收藏</Text>
                <View className="header-right">
                    <Text className="count">{favoriteIds.length}家</Text>
                </View>
            </View>

            {/* Content */}
            <ScrollView
                scrollY
                className="favorites-scroll"
                scrollTop={scrollTop}
                scrollWithAnimation={false}
            >
                <View className="favorites-content">
                    {favoriteIds.length === 0 ? (
                        <View className="empty-state">
                            <Text className="empty-icon">💝</Text>
                            <Text className="empty-title">暂无收藏</Text>
                            <Text className="empty-desc">浏览酒店时点击心形图标即可收藏</Text>
                            <View
                                className="empty-action"
                                onClick={() => Taro.reLaunch({ url: '/pages/index/index' })}
                            >
                                <Text className="action-text">去逛逛</Text>
                            </View>
                        </View>
                    ) : (
                        <View className="favorites-list">
                            {favoriteIds.map((hotelId) => (
                                <FavoriteItem
                                    key={hotelId}
                                    hotelId={hotelId}
                                    onRemove={handleRemove}
                                    onView={handleView}
                                />
                            ))}
                        </View>
                    )}
                    <View className="bottom-spacer" />
                </View>
            </ScrollView>
        </View>
    );
}
