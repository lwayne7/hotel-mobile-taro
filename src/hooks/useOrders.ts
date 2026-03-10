import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, paymentApi } from '../services/api';
import type { Order, PageResponse } from '../types/order';
import Taro from '@tarojs/taro';

// ============ 查询键常量 ============
export const orderKeys = {
    all: () => ['orders'] as const,
    mine: (page?: number) => [...orderKeys.all(), 'mine', page ?? 1] as const,
};

// ============ 我的订单列表 Hook ============
export function useMyOrders(page = 1, pageSize = 20) {
    return useQuery<PageResponse<Order>>({
        queryKey: orderKeys.mine(page),
        queryFn: () => orderApi.mine({ page, pageSize }),
        retry: 1,
    });
}

// ============ 取消订单 Mutation ============
export function useCancelOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderId: number) => orderApi.cancel(orderId),
        onSuccess: () => {
            Taro.showToast({ title: '已取消', icon: 'none' });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all() });
        },
        onError: (e: any) => {
            Taro.showToast({ title: e?.message || '取消失败', icon: 'none' });
        },
    });
}

// ============ 删除订单 Mutation ============
export function useDeleteOrder() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderId: number) => orderApi.remove(orderId),
        onSuccess: () => {
            Taro.showToast({ title: '已删除', icon: 'none' });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all() });
        },
        onError: (e: any) => {
            Taro.showToast({ title: e?.message || '删除失败', icon: 'none' });
        },
    });
}

// ============ 模拟支付 Mutation ============
export function useSimulatePayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (orderId: number) => {
            const now = new Date();
            const eventId = `evt_${now.getTime()}_${Math.random().toString(16).slice(2, 8)}`;
            return paymentApi.callback({
                eventId,
                orderId,
                paymentNo: `pay_${Math.random().toString(16).slice(2, 10)}`,
                paidAt: now.toISOString(),
            });
        },
        onSuccess: () => {
            Taro.showToast({ title: '模拟支付回调成功', icon: 'none' });
            void queryClient.invalidateQueries({ queryKey: orderKeys.all() });
        },
        onError: (e: any) => {
            Taro.showToast({ title: e?.message || '支付回调失败', icon: 'none' });
        },
    });
}
