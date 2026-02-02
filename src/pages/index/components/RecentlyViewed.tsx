/**
 * 最近浏览组件
 * 展示用户最近浏览过的酒店
 */
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useHotelStore } from '../../../store/useHotelStore';
import type { Hotel } from '../../../types/hotel';

export function RecentlyViewed() {
    const recentlyViewed = useHotelStore((s) => s.recentlyViewed);

    const handleHotelClick = (hotel: Hotel) => {
        Taro.navigateTo({ url: `/pages/hotel-detail/index?id=${hotel.id}` });
    };

    // 没有浏览记录时不显示
    if (!recentlyViewed.length) return null;

    return (
        <View className="recently-viewed">
            <View className="recently-viewed-header">
                <Text className="recently-viewed-title">📍 最近浏览</Text>
                <Text className="recently-viewed-count">{recentlyViewed.length}家</Text>
            </View>
            <ScrollView scrollX className="recently-viewed-scroll">
                <View className="recently-viewed-list">
                    {recentlyViewed.slice(0, 10).map((hotel) => {
                        const minPrice = hotel.roomTypes?.length
                            ? Math.min(...hotel.roomTypes.map((r: any) => Number(r?.price || 0)).filter((n: number) => !isNaN(n) && n > 0))
                            : 0;
                        const image = hotel.images?.[0]?.imageUrl || '';

                        return (
                            <View
                                key={hotel.id}
                                className="recently-viewed-item"
                                onClick={() => handleHotelClick(hotel)}
                            >
                                <View className="recently-viewed-image-wrap">
                                    {image ? (
                                        <Image src={image} mode="aspectFill" className="recently-viewed-image" />
                                    ) : (
                                        <View className="recently-viewed-image-placeholder">🏨</View>
                                    )}
                                </View>
                                <Text className="recently-viewed-name" numberOfLines={1}>{hotel.nameCn}</Text>
                                <Text className="recently-viewed-price">¥{minPrice}<Text className="price-suffix">起</Text></Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}
