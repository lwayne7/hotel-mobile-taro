/**
 * 位置距离筛选弹窗
 */
import { View, Text, ScrollView } from '@tarojs/components';
import {
  LOCATION_CATEGORIES,
  DISTANCE_OPTIONS,
  HOT_LOCATIONS,
  DEFAULT_HOT_LOCATIONS,
} from '../../../constants/filters';
import './LocationFilter.scss';

interface LocationFilterProps {
  city: string;
  selectedCategory: string;
  selectedLocation: string;
  maxDistance: number | null;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  onDistanceChange: (distance: number | null) => void;
  onConfirm: () => void;
  onClear: () => void;
}

export default function LocationFilter({
  city,
  selectedCategory,
  selectedLocation,
  maxDistance,
  onCategoryChange,
  onLocationChange,
  onDistanceChange,
  onConfirm,
  onClear,
}: LocationFilterProps) {
  const hotLocations = HOT_LOCATIONS[city] || DEFAULT_HOT_LOCATIONS;

  const renderRightContent = () => {
    if (selectedCategory === 'distance') {
      return (
        <View className="distance-options">
          {DISTANCE_OPTIONS.map((opt) => (
            <View
              key={opt.key}
              className={`distance-option ${maxDistance === opt.value ? 'active' : ''}`}
              onClick={() => onDistanceChange(maxDistance === opt.value ? null : opt.value)}
            >
              <Text>{opt.label}</Text>
            </View>
          ))}
        </View>
      );
    }

    if (selectedCategory === 'hot') {
      return (
        <View className="location-list">
          <View className="location-map-entry">
            <Text className="map-text">地图选酒店</Text>
            <Text className="map-go">GO{'>'}</Text>
          </View>
          {hotLocations.map((loc) => (
            <View
              key={loc.name}
              className={`location-item ${selectedLocation === loc.name ? 'active' : ''}`}
              onClick={() => onLocationChange(selectedLocation === loc.name ? '' : loc.name)}
            >
              <View className="location-info">
                <Text className="location-name">{loc.name}</Text>
                <Text className="location-percent">{loc.percent}% 用户选择</Text>
              </View>
            </View>
          ))}
        </View>
      );
    }

    // 其他分类暂时显示占位
    return (
      <View className="location-list">
        <View className="empty-hint">
          <Text>暂无数据</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="location-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <ScrollView scrollY className="category-list">
          {LOCATION_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-item ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.key)}
            >
              <Text>{cat.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧内容 */}
        <ScrollView scrollY className="content-area">
          {renderRightContent()}
        </ScrollView>
      </View>

      {/* 底部按钮 */}
      <View className="filter-footer">
        <View className="footer-btn clear-btn" onClick={onClear}>
          <Text>清空</Text>
        </View>
        <View className="footer-btn confirm-btn" onClick={onConfirm}>
          <Text>完成</Text>
        </View>
      </View>
    </View>
  );
}
