/**
 * 价格/星级筛选弹窗 - 左右分栏布局（优化版）
 */
import { useState } from 'react';
import { View, Text, ScrollView, Slider } from '@tarojs/components';
import { PRICE_RANGES, STAR_RATINGS } from '../../../constants/filters';
import './PriceFilter.scss';

interface PriceFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  priceRange: string | null;
  starRating: number | null;
  onMinPriceChange: (price: number | null) => void;
  onMaxPriceChange: (price: number | null) => void;
  onPriceRangeChange: (range: string | null) => void;
  onStarRatingChange: (rating: number | null) => void;
  onConfirm: () => void;
  onClear: () => void;
}

// 左侧分类菜单
const PRICE_CATEGORIES = [
  { key: 'price', label: '价格', icon: '💰' },
  { key: 'star', label: '星级', icon: '⭐' },
];

const STAR_ICONS: Record<number, string> = {
  1: '💎',
  2: '💎💎',
  3: '⭐⭐⭐',
  4: '⭐⭐⭐⭐',
  5: '👑',
};

export default function PriceFilter({
  minPrice,
  maxPrice,
  priceRange,
  starRating,
  onMinPriceChange,
  onMaxPriceChange,
  onPriceRangeChange,
  onStarRatingChange,
  onConfirm,
  onClear,
}: PriceFilterProps) {
  const [activeCategory, setActiveCategory] = useState('price');

  const handlePriceRangeClick = (range: typeof PRICE_RANGES[0]) => {
    if (priceRange === range.key) {
      onPriceRangeChange(null);
      onMinPriceChange(null);
      onMaxPriceChange(null);
    } else {
      onPriceRangeChange(range.key);
      onMinPriceChange(range.min);
      onMaxPriceChange(range.max ?? null);
    }
  };

  const handleStarClick = (star: typeof STAR_RATINGS[0]) => {
    if (starRating === star.value) {
      onStarRatingChange(null);
    } else {
      onStarRatingChange(star.value);
    }
  };

  const renderPriceContent = () => (
    <View className="price-content">
      {/* 价格范围展示 */}
      <View className="price-range-display">
        <View className={`price-box ${minPrice ? 'has-value' : ''}`}>
          <Text className="price-box-label">最低</Text>
          <Text className="price-box-value">¥{minPrice || 0}</Text>
        </View>
        <View className="price-range-connector">
          <View className="connector-line" />
          <Text className="connector-text">至</Text>
          <View className="connector-line" />
        </View>
        <View className={`price-box ${maxPrice ? 'has-value' : ''}`}>
          <Text className="price-box-label">最高</Text>
          <Text className="price-box-value">{maxPrice ? `¥${maxPrice}` : '不限'}</Text>
        </View>
      </View>

      {/* 价格滑块 */}
      <View className="price-slider-wrap">
        <Slider
          min={0}
          max={1900}
          step={50}
          value={maxPrice || 1900}
          activeColor="#1677ff"
          backgroundColor="#e6edf8"
          blockSize={20}
          blockColor="#fff"
          onChange={(e) => {
            const val = e.detail.value;
            onMaxPriceChange(val >= 1900 ? null : val);
            onPriceRangeChange(null);
          }}
        />
        <View className="slider-labels">
          <Text className="slider-label">¥0</Text>
          <Text className="slider-label">¥1900+</Text>
        </View>
      </View>

      {/* 快速选择价格区间 */}
      <View className="price-section-title">
        <Text className="section-title-text">快速选择</Text>
      </View>
      <View className="price-quick-grid">
        {PRICE_RANGES.map((range) => (
          <View
            key={range.key}
            className={`price-tag ${priceRange === range.key ? 'active' : ''}`}
            onClick={() => handlePriceRangeClick(range)}
          >
            <Text className="price-tag-text">{range.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStarContent = () => (
    <View className="star-content">
      <View className="star-section-title">
        <Text className="section-title-text">酒店星级/钻级</Text>
        <Text className="star-hint-link">等级说明 ›</Text>
      </View>

      <View className="star-list">
        {STAR_RATINGS.map((star) => (
          <View
            key={star.key}
            className={`star-card ${starRating === star.value ? 'active' : ''}`}
            onClick={() => handleStarClick(star)}
          >
            <View className="star-card-left">
              <Text className="star-card-icon">{STAR_ICONS[star.value] || '⭐'}</Text>
              <View className="star-card-info">
                <Text className="star-card-label">{star.label}</Text>
                <Text className="star-card-desc">{star.subLabel}</Text>
              </View>
            </View>
            <View className={`star-check ${starRating === star.value ? 'checked' : ''}`}>
              {starRating === star.value && <Text className="check-mark">✓</Text>}
            </View>
          </View>
        ))}
      </View>

      <Text className="star-note">
        酒店未参加星级评定但设施服务达到相应水平，采用钻级分类，仅供参考
      </Text>
    </View>
  );

  const hasFilter = minPrice != null || maxPrice != null || priceRange != null || starRating != null;

  return (
    <View className="price-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <View className="category-sidebar">
          {PRICE_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <Text className="category-icon">{cat.icon}</Text>
              <Text className="category-label">{cat.label}</Text>
              {activeCategory === cat.key && <View className="category-indicator" />}
            </View>
          ))}
        </View>

        {/* 右侧内容 */}
        <ScrollView scrollY className="content-area">
          {activeCategory === 'price' ? renderPriceContent() : renderStarContent()}
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
