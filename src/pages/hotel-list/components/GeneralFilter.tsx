/**
 * 综合筛选弹窗（优化版）
 */
import React from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import {
  FILTER_CATEGORIES,
  HOT_FILTER_TAGS,
  ACCOMMODATION_TYPES,
  HOTEL_FEATURES,
  ROOM_FEATURES,
  FACILITIES,
  HOTEL_BRANDS,
} from '../../../constants/filters';
import './GeneralFilter.scss';

interface GeneralFilterProps {
  historyTags: string[];
  hotTags: string[];
  accommodationType: string[];
  hotelFeatures: string[];
  roomFeatures: string[];
  facilities: string[];
  brands: string[];
  onHotTagToggle: (tag: string) => void;
  onAccommodationTypeToggle: (type: string) => void;
  onHotelFeatureToggle: (feature: string) => void;
  onRoomFeatureToggle: (feature: string) => void;
  onFacilityToggle: (facility: string) => void;
  onBrandToggle: (brand: string) => void;
  onConfirm: () => void;
  onClear: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  history: '🕐',
  hot: '🔥',
  type: '🏨',
  theme: '✨',
  brand: '🏷️',
  facility: '🛎️',
  room: '🛏️',
};

export default function GeneralFilter({
  historyTags,
  hotTags,
  accommodationType,
  hotelFeatures,
  roomFeatures,
  facilities,
  brands,
  onHotTagToggle,
  onAccommodationTypeToggle,
  onHotelFeatureToggle,
  onRoomFeatureToggle,
  onFacilityToggle,
  onBrandToggle,
  onConfirm,
  onClear,
}: GeneralFilterProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('hot');

  const totalCount = hotTags.length + accommodationType.length + hotelFeatures.length
    + roomFeatures.length + facilities.length + brands.length;

  const renderTagGrid = (
    items: { key: string; label: string }[],
    activeList: string[],
    onToggle: (key: string) => void,
    title: string,
  ) => (
    <View className="tag-section">
      <Text className="tag-section-title">{title}</Text>
      <View className="tag-grid">
        {items.map((item) => {
          const isActive = activeList.includes(item.key);
          return (
            <View
              key={item.key}
              className={`filter-chip ${isActive ? 'active' : ''}`}
              onClick={() => onToggle(item.key)}
            >
              <Text className="filter-chip-text">{item.label}</Text>
              {isActive && <Text className="filter-chip-check">✓</Text>}
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'history':
        return (
          <View className="filter-content">
            <Text className="content-section-title">历史筛选</Text>
            {historyTags.length > 0 ? (
              <View className="tag-grid">
                {historyTags.map((tag) => {
                  const isActive = hotTags.includes(tag);
                  return (
                    <View
                      key={tag}
                      className={`filter-chip ${isActive ? 'active' : ''}`}
                      onClick={() => onHotTagToggle(tag)}
                    >
                      <Text className="filter-chip-text">{tag}</Text>
                      {isActive && <Text className="filter-chip-check">✓</Text>}
                    </View>
                  );
                })}
              </View>
            ) : (
              <View className="empty-state">
                <Text className="empty-icon">🕐</Text>
                <Text className="empty-text">暂无历史筛选</Text>
              </View>
            )}
          </View>
        );

      case 'hot':
        return (
          <View className="filter-content">
            <Text className="content-section-title">热门筛选</Text>
            <View className="tag-grid">
              {HOT_FILTER_TAGS.map((tag) => {
                const isActive = hotTags.includes(tag);
                return (
                  <View
                    key={tag}
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    onClick={() => onHotTagToggle(tag)}
                  >
                    <Text className="filter-chip-text">{tag}</Text>
                    {isActive && <Text className="filter-chip-check">✓</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'type':
        return (
          <View className="filter-content">
            {renderTagGrid(ACCOMMODATION_TYPES, accommodationType, onAccommodationTypeToggle, '住宿类型')}
          </View>
        );

      case 'theme':
        return (
          <View className="filter-content">
            {renderTagGrid(HOTEL_FEATURES, hotelFeatures, onHotelFeatureToggle, '酒店特色')}
            {renderTagGrid(ROOM_FEATURES, roomFeatures, onRoomFeatureToggle, '客房特色')}
          </View>
        );

      case 'facility':
        return (
          <View className="filter-content">
            {renderTagGrid(FACILITIES, facilities, onFacilityToggle, '设施服务')}
          </View>
        );

      case 'brand':
        return (
          <View className="filter-content">
            <Text className="content-section-title">品牌</Text>
            <View className="tag-grid">
              {HOTEL_BRANDS.map((brand) => {
                const isActive = brands.includes(brand);
                return (
                  <View
                    key={brand}
                    className={`filter-chip ${isActive ? 'active' : ''}`}
                    onClick={() => onBrandToggle(brand)}
                  >
                    <Text className="filter-chip-text">{brand}</Text>
                    {isActive && <Text className="filter-chip-check">✓</Text>}
                  </View>
                );
              })}
            </View>
          </View>
        );

      case 'room':
        return (
          <View className="filter-content">
            {renderTagGrid(ROOM_FEATURES, roomFeatures, onRoomFeatureToggle, '床型餐食')}
          </View>
        );

      default:
        return (
          <View className="filter-content">
            <View className="empty-state">
              <Text className="empty-icon">📋</Text>
              <Text className="empty-text">暂无更多选项</Text>
            </View>
          </View>
        );
    }
  };

  return (
    <View className="general-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <ScrollView scrollY className="category-sidebar">
          {FILTER_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-tab ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <Text className="category-icon">{CATEGORY_ICONS[cat.key] || '📋'}</Text>
              <Text className="category-label">{cat.label}</Text>
              {selectedCategory === cat.key && <View className="category-indicator" />}
            </View>
          ))}
        </ScrollView>

        {/* 右侧内容 */}
        <ScrollView scrollY className="content-area">
          {renderCategoryContent()}
        </ScrollView>
      </View>

      {/* 底部按钮 */}
      <View className="filter-footer">
        <View className="footer-btn clear-btn" onClick={onClear}>
          <Text className="clear-btn-text">清空</Text>
        </View>
        <View className={`footer-btn confirm-btn ${totalCount > 0 ? 'has-filter' : ''}`} onClick={onConfirm}>
          <Text className="confirm-btn-text">完成{totalCount > 0 ? `(${totalCount})` : ''}</Text>
        </View>
      </View>
    </View>
  );
}
