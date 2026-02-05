/**
 * 热门城市区块组件
 */
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useSearchStore } from '../../../store/useSearchStore';
import { POPULAR_CITIES } from '../../../constants/cities';

export function HotCities() {
    const setCity = useSearchStore((s) => s.setCity);

    const handleCityClick = (city: string) => {
        setCity(city);
        Taro.navigateTo({
            url: `/pages/hotel-list/index?city=${encodeURIComponent(city)}`,
        });
    };

    return (
        <View className="ctrip-section">
            <Text className="ctrip-section-title">热门城市</Text>
            <View className="ctrip-city-chips">
                {POPULAR_CITIES.map((c) => (
                    <Text key={c} className="ctrip-chip" onClick={() => handleCityClick(c)}>
                        {c}
                    </Text>
                ))}
            </View>
        </View>
    );
}
