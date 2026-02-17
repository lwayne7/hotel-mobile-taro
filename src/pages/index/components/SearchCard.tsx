/**
 * 搜索卡片组件
 * 包含城市选择、关键词输入、日期选择、价格/星级筛选
 */
import { useState, useCallback, useEffect } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useSearchStore } from '../../../store/useSearchStore';
import { Button, Popup } from '../../../components/ui';
import Calendar from '../../../components/Calendar';
import { POPULAR_CITIES, ALL_CITIES } from '../../../constants/cities';
import dayjs, { Dayjs } from 'dayjs';
import { useLocation } from '../../../hooks/useLocation';

const TABS = [
    { key: 'domestic', label: '国内' },
    { key: 'overseas', label: '海外' },
    { key: 'hourly', label: '钟点房' },
    { key: 'homestay', label: '民宿' },
];

const STAR_OPTIONS = [
    { value: 0, label: '不限' },
    { value: 2, label: '经济型' },
    { value: 3, label: '舒适型' },
    { value: 4, label: '高档型' },
    { value: 5, label: '豪华型' },
];

const PRICE_OPTIONS = [
    { label: '不限', min: undefined, max: undefined },
    { label: '¥150以下', min: undefined, max: 150 },
    { label: '¥150-300', min: 150, max: 300 },
    { label: '¥300-450', min: 300, max: 450 },
    { label: '¥450-600', min: 450, max: 600 },
    { label: '¥600以上', min: 600, max: undefined },
];

const QUICK_TAGS = ['亲子', '豪华', '免费停车场', '含早餐', '健身房'];

export interface SearchCardProps {
    onSearch: () => void;
    onQuickTagSearch?: (keyword: string) => void;
}

export function SearchCard({ onSearch, onQuickTagSearch }: SearchCardProps) {
    // Zustand store - 使用选择器
    const city = useSearchStore((s) => s.city);
    const keyword = useSearchStore((s) => s.keyword);
    const storeCheckIn = useSearchStore((s) => s.checkIn);
    const storeCheckOut = useSearchStore((s) => s.checkOut);
    const starRating = useSearchStore((s) => s.starRating);
    const priceRange = useSearchStore((s) => s.priceRange);
    const setCity = useSearchStore((s) => s.setCity);
    const setKeyword = useSearchStore((s) => s.setKeyword);
    const setCheckIn = useSearchStore((s) => s.setCheckIn);
    const setCheckOut = useSearchStore((s) => s.setCheckOut);
    const setStarRating = useSearchStore((s) => s.setStarRating);
    const setPriceRange = useSearchStore((s) => s.setPriceRange);
    const setPriceRangeValues = useSearchStore((s) => s.setPriceRangeValues);
    const resetFilters = useSearchStore((s) => s.resetFilters);

    // 本地 UI 状态
    const [activeTab, setActiveTab] = useState('domestic');
    const [showDatePicker, setShowDatePicker] = useState<'checkIn' | 'checkOut' | null>(null);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);

    // 搜索历史
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    useEffect(() => {
        Taro.getStorage({ key: 'search_history' })
            .then((res) => { if (Array.isArray(res.data)) setSearchHistory(res.data); })
            .catch(() => {});
    }, []);
    const addToHistory = useCallback((text: string) => {
        if (!text.trim()) return;
        setSearchHistory((prev) => {
            const next = [text.trim(), ...prev.filter((h) => h !== text.trim())].slice(0, 8);
            Taro.setStorage({ key: 'search_history', data: next });
            return next;
        });
    }, []);
    const clearHistory = useCallback(() => {
        setSearchHistory([]);
        Taro.removeStorage({ key: 'search_history' });
    }, []);

    // 日期计算
    const checkIn = storeCheckIn ? dayjs(storeCheckIn) : dayjs();
    const checkOut = storeCheckOut ? dayjs(storeCheckOut) : dayjs().add(1, 'day');
    const nights = Math.max(1, checkOut.diff(checkIn, 'day'));
    const today = dayjs().startOf('day');
    const minDate = today;

    const checkInDateLabel = checkIn.isSame(today, 'day') ? '今天' : checkIn.isSame(today.add(1, 'day'), 'day') ? '明天' : '';
    const checkOutDateLabel = checkOut.isSame(today, 'day') ? '今天' : checkOut.isSame(today.add(1, 'day'), 'day') ? '明天' : '';

    const { gpsLoading, handleGpsLocation } = useLocation({
        onCityDetected: (cityName) => {
            setCity(cityName);
        },
        onUnsupported: () => {
            setShowCityModal(true);
        },
        onError: () => {
            setShowCityModal(true);
        },
    });

    const onCalendarSelect = useCallback((date: Dayjs) => {
        if (showDatePicker === 'checkIn') {
            setCheckIn(date.format('YYYY-MM-DD'));
            if (date.isAfter(checkOut, 'day') || date.isSame(checkOut, 'day')) {
                setCheckOut(date.add(1, 'day').format('YYYY-MM-DD'));
            }
            setShowDatePicker(null);
            return;
        }

        if (showDatePicker === 'checkOut') {
            const minCheckOut = checkIn.add(1, 'day');
            const nextCheckOut = date.isBefore(minCheckOut, 'day') || date.isSame(minCheckOut, 'day') ? minCheckOut : date;
            setCheckOut(nextCheckOut.format('YYYY-MM-DD'));
            setShowDatePicker(null);
        }
    }, [showDatePicker, checkIn, checkOut, setCheckIn, setCheckOut]);


    // 快捷标签点击即查询
    const handleQuickTagClick = useCallback((tag: string) => {
        // 如果有快捷标签搜索回调，直接使用（解决状态延迟问题）
        if (onQuickTagSearch) {
            onQuickTagSearch(tag);
        } else {
            // 降级方案：设置关键词后触发搜索
            setKeyword(tag);
            onSearch();
        }
    }, [onQuickTagSearch, setKeyword, onSearch]);

    return (
        <>
            <View className="search-card-container">
                <View className="ctrip-search-tabs">
                    {TABS.map((tab) => (
                        <View
                            key={tab.key}
                            className={`ctrip-search-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            <Text className="tab-label">{tab.label}</Text>
                            {activeTab === tab.key && <View className="tab-indicator" />}
                        </View>
                    ))}
                </View>

                <View className="search-fields">
                    {/* City & Keyword */}
                    <View className="search-row border-bottom">
                        <View className="city-selector" onClick={() => setShowCityModal(true)}>
                            <View className="city-text-row">
                                <Text className="city-text">{city || '选择城市'}</Text>
                                <Text className="city-arrow">▼</Text>
                            </View>
                            <Text className="city-sub-label">当前定位</Text>
                        </View>
                        <View className="divider-vertical" />
                        <Input
                            className="keyword-input"
                            placeholder="位置/品牌/酒店"
                            placeholderClass="placeholder-gray"
                            value={keyword}
                            onInput={(e) => setKeyword(e.detail.value)}
                        />
                        <View
                            className={`gps-icon ${gpsLoading ? 'loading' : ''}`}
                            onClick={handleGpsLocation}
                            hoverClass="gps-icon-hover"
                            hoverStayTime={100}
                        >
                            <Text className="gps-symbol">{gpsLoading ? '...' : '◎'}</Text>
                        </View>
                    </View>

                    {/* Dates - 水平一行布局 */}
                    <View className="search-row date-row border-bottom">
                        <View className="date-item" onClick={() => setShowDatePicker('checkIn')}>
                            <Text className="date-value">{checkIn.format('MM月DD日')}</Text>
                            <Text className="date-label-inline">{checkInDateLabel || ''}</Text>
                        </View>
                        <Text className="date-separator">-</Text>
                        <View className="date-item" onClick={() => setShowDatePicker('checkOut')}>
                            <Text className="date-value">{checkOut.format('MM月DD日')}</Text>
                            <Text className="date-label-inline">{checkOutDateLabel || ''}</Text>
                        </View>
                        <View className="date-nights">
                            <Text className="nights-text">共{nights}晚</Text>
                        </View>
                    </View>

                    {/* Tip */}
                    <View className="search-tip-row">
                        <Text className="tip-badge">🌙</Text>
                        <Text className="tip-text">当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
                    </View>

                    {/* Price/Star */}
                    <View className="search-row price-row" onClick={() => setShowFilterModal(true)}>
                        <Text className="price-val">价格/星级</Text>
                    </View>

                    {/* Quick Tags - 独立一行 */}
                    <View className="quick-tags-row">
                        {QUICK_TAGS.slice(0, 3).map((t) => (
                            <View
                                key={t}
                                className="quick-tag-chip"
                                onClick={() => handleQuickTagClick(t)}
                            >
                                <Text>{t}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Search History */}
                    {searchHistory.length > 0 && (
                        <View className="search-history-section">
                            <View className="search-history-header">
                                <Text className="search-history-title">搜索历史</Text>
                                <Text className="search-history-clear" onClick={clearHistory}>清除</Text>
                            </View>
                            <View className="search-history-tags">
                                {searchHistory.map((h) => (
                                    <Text
                                        key={h}
                                        className="search-history-tag"
                                        onClick={() => {
                                            setKeyword(h);
                                            if (onQuickTagSearch) onQuickTagSearch(h);
                                            else onSearch();
                                        }}
                                    >
                                        {h}
                                    </Text>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Button */}
                    <Button
                        type="primary"
                        block
                        className="search-submit-btn"
                        onClick={() => {
                            addToHistory(keyword);
                            onSearch();
                        }}
                    >
                        查询
                    </Button>
                </View>
            </View>

            {/* Calendar Picker */}
            <Popup
                visible={!!showDatePicker}
                position="bottom"
                onClose={() => setShowDatePicker(null)}
            >
                <View className="calendar-popup-content">
                    <Calendar
                        value={showDatePicker === 'checkIn' ? checkIn : checkOut}
                        minDate={
                            showDatePicker === 'checkIn'
                                ? minDate
                                : checkIn.add(1, 'day')
                        }
                        onChange={onCalendarSelect}
                        title={showDatePicker === 'checkIn' ? '选择入住日期' : '选择离店日期'}
                    />
                </View>
            </Popup>

            {/* City Selection Modal */}
            <Popup
                visible={showCityModal}
                position="center"
                onClose={() => setShowCityModal(false)}
            >
                <View className="ctrip-modal-content">
                    <View className="modal-header">
                        <Text className="modal-title">选择城市</Text>
                        <Text className="modal-close" onClick={() => setShowCityModal(false)}>✕</Text>
                    </View>
                    <View className="city-modal-list">
                        <Text className="city-modal-section">热门</Text>
                        {POPULAR_CITIES.map((c) => (
                            <Text
                                key={c}
                                className={`city-modal-item ${city === c ? 'active' : ''}`}
                                onClick={() => {
                                    setCity(c);
                                    setShowCityModal(false);
                                }}
                            >
                                {c}
                            </Text>
                        ))}
                        <Text className="city-modal-section">全部</Text>
                        {ALL_CITIES.filter((c) => !POPULAR_CITIES.includes(c)).map((c) => (
                            <Text
                                key={c}
                                className={`city-modal-item ${city === c ? 'active' : ''}`}
                                onClick={() => {
                                    setCity(c);
                                    setShowCityModal(false);
                                }}
                            >
                                {c}
                            </Text>
                        ))}
                    </View>
                </View>
            </Popup>

            {/* Filter Modal */}
            <Popup
                visible={showFilterModal}
                position="bottom"
                onClose={() => setShowFilterModal(false)}
            >
                <View className="ctrip-modal-content filter-modal">
                    <View className="modal-header">
                        <Text className="modal-title">筛选条件</Text>
                        <Text className="modal-close" onClick={() => setShowFilterModal(false)}>✕</Text>
                    </View>
                    <View className="filter-section">
                        <Text className="filter-label">酒店星级</Text>
                        <View className="filter-options">
                            {STAR_OPTIONS.map((s) => (
                                <Text
                                    key={s.value}
                                    className={`filter-option ${starRating === s.value ? 'active' : ''}`}
                                    onClick={() => setStarRating(s.value)}
                                >
                                    {s.label}
                                </Text>
                            ))}
                        </View>
                    </View>
                    <View className="filter-section">
                        <Text className="filter-label">价格区间</Text>
                        <View className="filter-price-tags">
                            {PRICE_OPTIONS.map((p) => (
                                <Text
                                    key={p.label}
                                    className={`filter-price-tag ${priceRange === p.label ? 'active' : ''}`}
                                    onClick={() => {
                                        setPriceRange(p.label);
                                        setPriceRangeValues(p.min, p.max);
                                    }}
                                >
                                    {p.label}
                                </Text>
                            ))}
                        </View>
                    </View>
                    <View className="modal-footer">
                        <Button onClick={() => resetFilters()}>
                            重置
                        </Button>
                        <Button type="primary" onClick={() => setShowFilterModal(false)}>
                            确定
                        </Button>
                    </View>
                </View>
            </Popup>
        </>
    );
}
