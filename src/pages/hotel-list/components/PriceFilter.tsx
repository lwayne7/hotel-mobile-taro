/**
 * 价格/星级筛选弹窗 - 左右分栏布局
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
  { key: 'price', label: '价格' },
  { key: 'star', label: '星级/钻级' },
];

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
      {/* 价格滑块 */}
      <View className="price-slider-section">
        <Slider
          min={0}
          max={1900}
          step={50}
          value={maxPrice || 1900}
          activeColor="#0086f6"
          backgroundColor="#e0e0e0"
          blockSize={20}
          onChange={(e) => {
            const val = e.detail.value;
            onMaxPriceChange(val >= 1900 ? null : val);
            onPriceRangeChange(null);
          }}
        />
      </View>
      
      {/* 价格输入显示 */}
      <View className="price-inputs">
        <View className="price-input-box">
          <Text className="price-label">最低</Text>
          <Text className="price-value">¥{minPrice || 0}</Text>
        </View>
        <Text className="price-separator">—</Text>
        <View className="price-input-box">
          <Text className="price-label">最高</Text>
          <Text className="price-value">{maxPrice ? `¥${maxPrice}` : '¥1900以上'}</Text>
        </View>
      </View>
      
      {/* 快速选择价格区间 */}
      <View className="price-quick-options">
        {PRICE_RANGES.map((range) => (
          <View
            key={range.key}
            className={`price-option ${priceRange === range.key ? 'active' : ''}`}
            onClick={() => handlePriceRangeClick(range)}
          >
            <Text>{range.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStarContent = () => (
    <View className="star-content">
      <View className="star-header">
        <Text className="star-hint">国内星级 / 钻级说明 {'>'}</Text>
      </View>
      
      <View className="star-options">
        {STAR_RATINGS.map((star) => (
          <View
            key={star.key}
            className={`star-option ${starRating === star.value ? 'active' : ''}`}
            onClick={() => handleStarClick(star)}
          >
            <Text className="star-label">{star.label}</Text>
            <Text className="star-sub">{star.subLabel}</Text>
          </View>
        ))}
      </View>
      
      <Text className="star-note">
        酒店未参加星级评定但设施服务达到相应水平，采用钻级分类，仅供参考
      </Text>
    </View>
  );

  return (
    <View className="price-filter">
      <View className="filter-body">
        {/* 左侧分类 */}
        <ScrollView scrollY className="category-list">
          {PRICE_CATEGORIES.map((cat) => (
            <View
              key={cat.key}
              className={`category-item ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              <Text>{cat.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 右侧内容 */}
        <ScrollView scrollY className="content-area">
          {activeCategory === 'price' ? renderPriceContent() : renderStarContent()}
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
