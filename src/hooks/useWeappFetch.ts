import { useState, useCallback, useEffect } from 'react';

export interface UseWeappFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

export interface UseWeappFetchOptions {
    /** 是否启用（仅在 weapp 环境下有效） */
    enabled?: boolean;
    /** 初始加载 */
    immediate?: boolean;
}

/**
 * weapp 环境下的数据获取 Hook
 * 用于在小程序环境中替代 TanStack Query，提供统一的数据获取接口
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useWeappFetch(
 *   () => publicHotelApi.getList({ city: '上海' }),
 *   { immediate: true }
 * );
 * ```
 */
export function useWeappFetch<T>(
    fetchFn: () => Promise<T>,
    options: UseWeappFetchOptions = {}
): UseWeappFetchResult<T> {
    const { enabled = true, immediate = true } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refetch = useCallback(() => {
        setRefreshKey((k) => k + 1);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        if (!immediate && refreshKey === 0) return;

        let cancelled = false;

        const doFetch = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchFn();
                if (!cancelled) {
                    setData(result);
                }
            } catch (e: unknown) {
                if (!cancelled) {
                    const err = e instanceof Error
                        ? e
                        : new Error(String((e as { message?: string })?.message ?? e));
                    setError(err);
                    setData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        doFetch();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, refreshKey]);

    return { data, loading, error, refetch };
}

export default useWeappFetch;
