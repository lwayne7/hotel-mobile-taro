import { View, Text, ScrollView } from '@tarojs/components';
import './GeneralFilter.scss'; // 复用现有筛选样式基础（如需要可拆出独立样式文件）

const FILTER_TABS = [
  { key: 'smart', label: '智能排序' },
  { key: 'distance', label: '位置区域' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];

interface FilterTabsProps {
  activeFilter: string | null;
  sortBy: string;
  locationFilterCount: number;
  priceFilterCount: number;
  generalFilterCount: number;
  quickTags: string[];
  localKeyword: string;
  onTabClick: (key: string) => void;
  onQuickTagClick: (tag: string) => void;
}

export function FilterTabs({
  activeFilter,
  sortBy,
  locationFilterCount,
  priceFilterCount,
  generalFilterCount,
  quickTags,
  localKeyword,
  onTabClick,
  onQuickTagClick,
}: FilterTabsProps) {
  return (
    <View className="ctrip-list-filters">
      <View className="filter-row-main">
        {FILTER_TABS.map((tab) => {
          const tabCount =
            tab.key === 'distance' ? locationFilterCount
              : tab.key === 'price' ? priceFilterCount
                : tab.key === 'filter' ? generalFilterCount
                  : 0;
          return (
            <View
              key={tab.key}
              className={`ctrip-filter-item ${sortBy === tab.key || activeFilter === tab.key ? 'active' : ''
                }`}
              onClick={() => onTabClick(tab.key)}
            >
              <Text>{tab.label}</Text>
              {tabCount > 0 && <Text className="filter-count">{tabCount}</Text>}
              <Text className={`filter-arrow ${activeFilter === tab.key ? 'up' : ''}`}>▼</Text>
            </View>
          );
        })}
      </View>
      <View className="filter-row-quick">
        <ScrollView scrollX className="filter-row-quick-inner" showScrollbar={false}>
          <View className="filter-quick-wrap">
            {quickTags.map((tag) => (
              <Text
                key={tag}
                className={`ctrip-quick-filter-tag ${localKeyword === tag ? 'active' : ''}`}
                onClick={() => onQuickTagClick(tag)}
              >
                {tag}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
