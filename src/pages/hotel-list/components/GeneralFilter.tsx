/**
 * 综合筛选弹窗
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

  const renderCategoryContent = () => {
    switch (selectedCategory) {
      case 'history':
        return (
          <View className="filter-content">
            <Text className="content-title">历史筛选</Text>
            <View className="tag-list">
              {historyTags.length > 0 ? (
                historyTags.map((tag) => (
                  <Text
                    key={tag}
                    className={`filter-tag ${hotTags.includes(tag) ? 'active' : ''}`}
                    onClick={() => onHotTagToggle(tag)}
                  >
                    {tag}
                  </Text>
                ))
              ) : (
                <Text className="empty-hint">暂无历史筛选</Text>
              )}
            </View>
          </View>
        );

      case 'hot':
        return (
          <View className="filter-content">
            <Text className="content-title">热门筛选</Text>
            <View className="tag-list">
              {HOT_FILTER_TAGS.map((tag) => (
                <Text
                  key={tag}
                  className={`filter-tag ${hotTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => onHotTagToggle(tag)}
                >
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        );

      case 'type':
        return (
          <View className="filter-content">
            <Text className="content-title">住宿类型</Text>
            <View className="tag-list">
              {ACCOMMODATION_TYPES.map((type) => (
                <Text
                  key={type.key}
                  className={`filter-tag ${accommodationType.includes(type.key) ? 'active' : ''}`}
                  onClick={() => onAccommodationTypeToggle(type.key)}
                >
                  {type.label}
                </Text>
              ))}
            </View>
          </View>
        );

      case 'theme':
        return (
          <View className="filter-content">
            <Text className="content-title">酒店特色</Text>
            <View className="tag-list">
              {HOTEL_FEATURES.map((feature) => (
                <Text
                  key={feature.key}
                  className={`filter-tag ${hotelFeatures.includes(feature.key) ? 'active' : ''}`}
                  onClick={() => onHotelFeatureToggle(feature.key)}
                >
                  {feature.label}
                </Text>
              ))}
            </View>
            
            <Text className="content-title" style={{ marginTop: '20px' }}>客房特色</Text>
            <View className="tag-list">
              {ROOM_FEATURES.map((feature) => (
                <Text
                  key={feature.key}
                  className={`filter-tag ${roomFeatures.includes(feature.key) ? 'active' : ''}`}
                  onClick={() => onRoomFeatureToggle(feature.key)}
                >
                  {feature.label}
                </Text>
              ))}
            </View>
          </View>
        );

      case 'facility':
        return (
          <View className="filter-content">
            <Text className="content-title">设施服务</Text>
            <View className="tag-list">
              {FACILITIES.map((facility) => (
                <Text
                  key={facility.key}
                  className={`filter-tag ${facilities.includes(facility.key) ? 'active' : ''}`}
                  onClick={() => onFacilityToggle(facility.key)}
                >
                  {facility.label}
                </Text>
              ))}
            </View>
          </View>
        );

      case 'brand':
        return (
          <View className="filter-content">
            <Text className="content-title">品牌</Text>
            <View className="tag-list">
              {HOTEL_BRANDS.map((brand) => (
                <Text
                  key={brand}
                  className={`filter-tag ${brands.includes(brand) ? 'active' : ''}`}
                  onClick={() => onBrandToggle(brand)}
                >
                  {brand}
                </Text>
              ))}
            </View>
          </View>
        );

      case 'room':
        return (
          <View className="filter-content">
            <Text className="content-title">床型餐食</Text>
            <View className="tag-list">
              {ROOM_FEATURES.map((feature) => (
                <Text
                  key={feature.key}
                  className={`filter-tag ${roomFeatures.includes(feature.key) ? 'active' : ''}`}
                  onClick={() => onRoomFeatureToggle(feature.key)}
                >
                  {feature.label}
                </Text>
              ))}
            </View>
          </View>
        );

      default:
        return (
          <View className="filter-content">
            <Text className="empty-hint">暂无更多选项</Text>
          </View>
        );
    }
  };

  return (
    <View className="general-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <ScrollView scrollY className="category-list">
          {FILTER_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-item ${selectedCategory === cat.key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.key)}
            >
              <Text>{cat.label}</Text>
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
          <Text>清空</Text>
        </View>
        <View className="footer-btn confirm-btn" onClick={onConfirm}>
          <Text>完成</Text>
        </View>
      </View>
    </View>
  );
}
