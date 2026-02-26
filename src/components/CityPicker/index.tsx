import { View, Text, ScrollView } from '@tarojs/components';
import { Popup } from '../ui';
import { POPULAR_CITIES, ALL_CITIES } from '../../constants/cities';
import './index.scss';

export interface CityPickerProps {
    visible: boolean;
    currentCity: string;
    gpsLoading?: boolean;
    onClose: () => void;
    onSelect: (city: string) => void;
    onGpsClick?: () => void;
}

/**
 * 城市选择弹窗组件
 * 支持热门城市、全部城市列表和 GPS 定位
 */
export function CityPicker({
    visible,
    currentCity,
    gpsLoading = false,
    onClose,
    onSelect,
    onGpsClick,
}: CityPickerProps) {
    const handleCityClick = (city: string) => {
        onSelect(city);
        onClose();
    };

    return (
        <Popup visible={visible} onClose={onClose} position="bottom" round>
            <View className="city-picker">
                <View className="city-picker-header">
                    <Text className="city-picker-title">选择城市</Text>
                    {onGpsClick && (
                        <View
                            className={`city-picker-gps ${gpsLoading ? 'loading' : ''}`}
                            onClick={onGpsClick}
                        >
                            <Text className="gps-icon">{gpsLoading ? '...' : '◎'}</Text>
                            <Text className="gps-label">定位</Text>
                        </View>
                    )}
                    <Text className="city-picker-close" onClick={onClose}>×</Text>
                </View>

                <ScrollView scrollY className="city-picker-list">
                    <View className="city-picker-list-inner">
                        <Text className="city-picker-section-label">热门</Text>
                        {POPULAR_CITIES.map((city) => (
                            <Text
                                key={city}
                                className={`city-picker-item ${currentCity === city ? 'active' : ''}`}
                                onClick={() => handleCityClick(city)}
                            >
                                {city}
                            </Text>
                        ))}

                        <Text className="city-picker-section-label">全部</Text>
                        {ALL_CITIES.filter((c) => !POPULAR_CITIES.includes(c)).map((city) => (
                            <Text
                                key={city}
                                className={`city-picker-item ${currentCity === city ? 'active' : ''}`}
                                onClick={() => handleCityClick(city)}
                            >
                                {city}
                            </Text>
                        ))}
                    </View>
                </ScrollView>
            </View>
        </Popup>
    );
}

export default CityPicker;
