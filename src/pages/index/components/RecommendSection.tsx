/**
 * 推荐酒店区块组件
 */
import Taro from '@tarojs/taro';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import { Skeleton } from '../../../components/ui';
import type { Hotel } from '../../../types/hotel';
import { getApiBaseCacheKey } from '../../../services/request';
import { platform } from '../../../styles/rn-utils';

export interface RecommendSectionProps {
    hotels: Hotel[];
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
    onRetry: () => void;
    onHotelClick: (id: number) => void;
}

export function RecommendSection({
    hotels,
    isLoading,
    isError,
    error,
    onRetry,
    onHotelClick,
}: RecommendSectionProps) {
    if (isLoading) {
        return (
            <View className="banner-skeleton">
                <Skeleton loading rows={0} avatar avatarSize={100} avatarShape="square" />
                <Skeleton loading rows={0} avatar avatarSize={100} avatarShape="square" />
            </View>
        );
    }

    if (isError) {
        return (
            <View className="error-container">
                <Text className="error-icon">⚠️</Text>
                <Text className="error-message">
                    {error?.message || '加载失败，请重试'}
                </Text>
                {error?.message?.includes('小程序请求域名未配置') ? (
                    <Text className="error-hint">小程序：开发者工具可勾选"不校验合法域名…"，真机需配置 HTTPS request 域名</Text>
                ) : error?.message?.includes('真机调试不能用') ? (
                    <Text className="error-hint">请把 TARO_APP_API_BASE 改成可访问的后端地址后重新编译</Text>
                ) : error?.message?.includes('无法连接') ? (
                    <Text className="error-hint">提示：cd hotel-management/backend && npm run start:dev</Text>
                ) : null}
                <View className="error-retry" onClick={onRetry}>
                    <Text>点击重试</Text>
                </View>
            </View>
        );
    }

    if (hotels.length === 0) {
        return (
            <View className="empty-container">
                <Text className="empty-icon">🏨</Text>
                <Text className="empty-message">暂无推荐酒店</Text>
                {platform.isWeapp && (() => {
                    try {
                        return Taro.getSystemInfoSync().platform === 'devtools';
                    } catch {
                        return false;
                    }
                })() && (
                    <Text className="empty-debug">Debug: API_BASE={getApiBaseCacheKey()}</Text>
                )}
            </View>
        );
    }

    return (
        <ScrollView scrollX className="ctrip-banner-scroll">
            {hotels.map((h) => (
                <View
                    key={h.id}
                    className="ctrip-banner-card"
                    onClick={() => onHotelClick(h.id)}
                >
                    <View className="ctrip-banner-cover">
                        {h.images?.[0]?.imageUrl ? (
                            <Image src={h.images[0].imageUrl} mode="aspectFill" lazyLoad className="ctrip-banner-img" />
                        ) : (
                            <View className="ctrip-banner-placeholder" />
                        )}
                    </View>
                    <View className="ctrip-banner-info">
                        <Text className="ctrip-banner-name">{h.nameCn}</Text>
                        <Text className="ctrip-banner-addr">{h.address}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}
