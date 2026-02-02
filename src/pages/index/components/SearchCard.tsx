/**
 * 搜索卡片组件
 * 包含城市选择、关键词输入、日期选择、价格/星级筛选
 */
import { useState, useCallback } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { useSearchStore } from '../../../store/useSearchStore';
import { Button, Popup } from '../../../components/ui';
import Calendar from '../../../components/Calendar';
import dayjs, { Dayjs } from 'dayjs';

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

const POPULAR_CITIES = [
    '北京', '上海', '广州', '深圳', '杭州', '成都', '西安', '三亚',
    '南京', '武汉', '厦门', '青岛', '重庆', '苏州', '长沙', '昆明',
];

const QUICK_TAGS = ['亲子', '豪华', '免费停车场', '含早餐', '健身房'];

export interface SearchCardProps {
    onSearch: () => void;
}

export function SearchCard({ onSearch }: SearchCardProps) {
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
    const [gpsLoading, setGpsLoading] = useState(false);

    // 日期计算
    const checkIn = storeCheckIn ? dayjs(storeCheckIn) : dayjs();
    const checkOut = storeCheckOut ? dayjs(storeCheckOut) : dayjs().add(1, 'day');
    const nights = Math.max(1, checkOut.diff(checkIn, 'day'));
    const today = dayjs().startOf('day');
    const minDate = today;

    const checkInDateLabel = checkIn.isSame(today, 'day') ? '今天' : checkIn.isSame(today.add(1, 'day'), 'day') ? '明天' : '';
    const checkOutDateLabel = checkOut.isSame(today, 'day') ? '今天' : checkOut.isSame(today.add(1, 'day'), 'day') ? '明天' : '';

    // GPS定位功能
    const handleGpsLocation = useCallback(() => {
        const isH5 = process.env.TARO_ENV === 'h5';
        setGpsLoading(true);

        if (isH5 && typeof window !== 'undefined') {
            const protocol = window.location.protocol;
            const hostname = window.location.hostname;
            const isSecure = protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';

            if (!isSecure) {
                setGpsLoading(false);
                Taro.showToast({
                    title: 'H5定位需要HTTPS，请手动选择城市',
                    icon: 'none',
                    duration: 2500
                });
                setShowCityModal(true);
                return;
            }
        }

        Taro.getLocation({
            type: 'wgs84',
            success: (res) => {
                setGpsLoading(false);
                const { longitude } = res;

                let detectedCity = '上海';
                if (longitude < 105) detectedCity = '成都';
                else if (longitude < 113) detectedCity = '武汉';
                else if (longitude < 114) detectedCity = '广州';
                else if (longitude < 115) detectedCity = '深圳';
                else if (longitude < 117) detectedCity = '杭州';
                else if (longitude < 120) detectedCity = '南京';
                else if (longitude < 122) detectedCity = '上海';
                else detectedCity = '北京';

                setCity(detectedCity);
                Taro.showToast({ title: `已定位到: ${detectedCity}`, icon: 'none' });
            },
            fail: (err) => {
                setGpsLoading(false);
                const errMsg = err?.errMsg || '';
                let toastMsg = '定位失败，请手动选择城市';

                if (isH5 && errMsg.includes('permission')) {
                    toastMsg = '请允许浏览器定位权限';
                } else if (isH5 && errMsg.includes('timeout')) {
                    toastMsg = '定位超时，请手动选择城市';
                } else if (errMsg.includes('auth deny')) {
                    toastMsg = '请在设置中开启定位权限';
                }

                Taro.showToast({ title: toastMsg, icon: 'none', duration: 2000 });
                setShowCityModal(true);
            },
        });
    }, [setCity]);

    const openCalendar = useCallback((type: 'checkIn' | 'checkOut') => {
        setShowDatePicker(type);
    }, []);

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

    const getFilterSummary = useCallback(() => {
        const parts: string[] = [];
        const starLabel = STAR_OPTIONS.find((s) => s.value === starRating)?.label;
        if (starRating > 0 && starLabel) parts.push(starLabel);
        if (priceRange !== '不限') parts.push(priceRange);
        return parts.length > 0 ? parts.join('/') : '低价/高档';
    }, [starRating, priceRange]);

    // 快捷标签点击即查询
    const handleQuickTagClick = useCallback((tag: string) => {
        // 将标签设置为关键词
        setKeyword(tag);
        // 立即触发搜索
        onSearch();
    }, [setKeyword, onSearch]);

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
                            <Text className="city-text">{city || '选择城市'}</Text>
                            <Text className="city-arrow">▼</Text>
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
                        >
                            <Text className="gps-text">{gpsLoading ? '定位中...' : '我的位置'}</Text>
                            <Text className="gps-symbol">{gpsLoading ? '...' : '⌖'}</Text>
                        </View>
                    </View>

                    {/* Dates */}
                    <View className="search-row date-row border-bottom">
                        <View className="date-col" onClick={() => openCalendar('checkIn')}>
                            <View className="date-header">
                                <Text className="date-label">入住</Text>
                                <Text className="date-big">{checkIn.format('MM月DD日')}</Text>
                                <Text className="date-small">{checkInDateLabel}</Text>
                            </View>
                        </View>
                        <View className="date-duration">
                            <Text className="duration-text">{nights}晚</Text>
                        </View>
                        <View className="date-col" onClick={() => openCalendar('checkOut')}>
                            <View className="date-header">
                                <Text className="date-label">离店</Text>
                                <Text className="date-big">{checkOut.format('MM月DD日')}</Text>
                                <Text className="date-small">{checkOutDateLabel}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Tip */}
                    <View className="search-tip-row">
                        <Text className="tip-badge">🌙</Text>
                        <Text className="tip-text">当前已过0点，如需今天凌晨6点前入住，请选择"今天凌晨"</Text>
                    </View>

                    {/* Price/Star & Tags */}
                    <View className="search-row price-row">
                        <View className="price-star-selector" onClick={() => setShowFilterModal(true)}>
                            <Text className="price-val">价格/星级</Text>
                            <Text className="price-sub">{getFilterSummary()}</Text>
                        </View>
                        <View className="quick-tags-clean">
                            {QUICK_TAGS.slice(0, 3).map((t) => (
                                <View
                                    key={t}
                                    className="quick-tag-item"
                                    onClick={() => handleQuickTagClick(t)}
                                >
                                    <Text>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Button */}
                    <Button type="primary" block onClick={onSearch}>
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
