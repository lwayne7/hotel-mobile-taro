/**
 * 位置筛选弹窗（优化版）
 */
import { View, Text, ScrollView } from '@tarojs/components';
import {
  LOCATION_CATEGORIES,
  HOT_LOCATIONS,
  DEFAULT_HOT_LOCATIONS,
  DISTRICT_LOCATIONS,
  DEFAULT_DISTRICT_LOCATIONS,
} from '../../../constants/filters';
import './LocationFilter.scss';

interface LocationFilterProps {
  city: string;
  selectedCategory: string;
  selectedLocation: string;
  onCategoryChange: (category: string) => void;
  onLocationChange: (location: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  hot: '🔥',
  district: '📍',
};

export default function LocationFilter({
  city,
  selectedCategory,
  selectedLocation,
  onCategoryChange,
  onLocationChange,
  onConfirm,
  onClear,
}: LocationFilterProps) {
  const hotLocations = HOT_LOCATIONS[city] || DEFAULT_HOT_LOCATIONS;
  const districtLocations = DISTRICT_LOCATIONS[city] || DEFAULT_DISTRICT_LOCATIONS;

  const hasFilter = !!selectedLocation;

  const renderLocationList = (locations: { name: string; percent: number }[]) => (
    <View className="location-list">
      {locations.map((loc, index) => {
        const isActive = selectedLocation === loc.name;
        return (
          <View
            key={loc.name}
            className={`location-card ${isActive ? 'active' : ''}`}
            onClick={() => onLocationChange(isActive ? '' : loc.name)}
          >
            <View className="location-card-left">
              <Text className="location-rank">{index + 1}</Text>
              <View className="location-card-info">
                <Text className="location-card-name">{loc.name}</Text>
                <View className="location-card-bar-wrap">
                  <View className="location-card-bar" style={{ width: `${Math.min(loc.percent * 2.5, 100)}%` }} />
                </View>
              </View>
            </View>
            <View className="location-card-right">
              <Text className="location-card-percent">{loc.percent}%</Text>
              {isActive && (
                <View className="location-check">
                  <Text className="location-check-mark">✓</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderRightContent = () => {
    if (selectedCategory === 'hot') {
      return (
        <View className="location-content">
          <View className="location-map-entry">
            <View className="map-entry-left">
              <Text className="map-entry-icon">🗺️</Text>
              <Text className="map-entry-text">地图选酒店</Text>
            </View>
            <View className="map-entry-btn">
              <Text className="map-entry-go">GO ›</Text>
            </View>
          </View>
          {renderLocationList(hotLocations)}
        </View>
      );
    }

    if (selectedCategory === 'district') {
      return (
        <View className="location-content">
          {renderLocationList(districtLocations)}
        </View>
      );
    }

    return (
      <View className="location-content">
        <View className="empty-state">
          <Text className="empty-icon">📭</Text>
          <Text className="empty-text">暂无数据</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="location-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <View className="category-sidebar">
          {LOCATION_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.key)}
            >
              <Text className="category-icon">{CATEGORY_ICONS[cat.key] || '📋'}</Text>
              <Text className="category-label">{cat.label}</Text>
              {selectedCategory === cat.key && <View className="category-indicator" />}
            </View>
          ))}
        </View>

        {/* 右侧内容 */}
        <ScrollView scrollY className="content-area">
          {renderRightContent()}
        </ScrollView>
      </View>

      {/* 底部按钮 */}
      <View className="filter-footer">
        <View className="footer-btn clear-btn" onClick={onClear}>
          <Text className="clear-btn-text">清空</Text>
        </View>
        <View className={`footer-btn confirm-btn ${hasFilter ? 'has-filter' : ''}`} onClick={onConfirm}>
          <Text className="confirm-btn-text">完成</Text>
        </View>
      </View>
    </View>
  );
}
