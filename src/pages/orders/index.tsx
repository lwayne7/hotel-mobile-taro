/** 我的订单（TanStack Query 统一状态管理 + 下单/取消/模拟支付回调幂等） */
import { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Skeleton } from '../../components/ui';
import { useMyOrders, useCancelOrder, useDeleteOrder, useSimulatePayment, orderKeys } from '../../hooks/useOrders';
import type { OrderStatus } from '../../types/order';

function formatMoney(cents: number): string {
  const n = Math.round(Number(cents) || 0) / 100;
  return n.toFixed(2);
}

function statusText(s: OrderStatus): string {
  switch (s) {
    case 'pending_payment':
      return '待支付';
    case 'paid':
      return '已支付';
    case 'cancelled':
      return '已取消';
    case 'expired':
      return '已过期';
    default:
      return s;
  }
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useMyOrders();
  const cancelMutation = useCancelOrder();
  const deleteMutation = useDeleteOrder();
  const payMutation = useSimulatePayment();

  const orders = data?.data || [];

  // 页面重新可见时刷新
  useDidShow(() => {
    void queryClient.invalidateQueries({ queryKey: orderKeys.all() });
  });

  const onCancel = useCallback((id: number) => {
    cancelMutation.mutate(id);
  }, [cancelMutation]);

  const onPay = useCallback((orderId: number) => {
    payMutation.mutate(orderId);
  }, [payMutation]);

  const onDelete = useCallback((orderId: number) => {
    deleteMutation.mutate(orderId);
  }, [deleteMutation]);

  const goLogin = useCallback(() => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent('/pages/orders/index')}`,
    });
  }, []);

  const content = useMemo(() => {
    if (isLoading) {
      return (
        <View style={{ padding: '16px' }}>
          <Skeleton loading rows={3} title />
          <View style={{ height: '12px' }} />
          <Skeleton loading rows={3} title />
        </View>
      );
    }

    if (error) {
      return (
        <View style={{ padding: '24px', textAlign: 'center' }}>
          <Text style={{ color: '#64748b', fontSize: '13px' }}>{error?.message || '加载失败（可能未登录）'}</Text>
          <View style={{ height: '12px' }} />
          <Button type="primary" onClick={goLogin}>去登录（customer）</Button>
        </View>
      );
    }

    if (!orders.length) {
      return (
        <View style={{ padding: '24px', textAlign: 'center' }}>
          <Text style={{ color: '#64748b', fontSize: '13px' }}>暂无订单</Text>
        </View>
      );
    }

    return (
      <View style={{ padding: '12px' }}>
        {orders.map((o) => (
          <View
            key={o.id}
            style={{
              background: '#fff',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '12px',
              border: '1px solid #e8eef9',
              boxShadow: '0 10px 22px rgba(14, 41, 87, 0.06)',
            }}
          >
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: 700 }}>{o.orderNo}</Text>
              <Text style={{ color: o.status === 'paid' ? '#059669' : '#f97316', fontSize: '12px' }}>
                {statusText(o.status)}
              </Text>
            </View>
            <View style={{ height: '8px' }} />
            <Text style={{ color: '#475569', fontSize: '12px', display: 'block' }}>
              入住 {o.checkInDate} · 离店 {o.checkOutDate} · {o.rooms}间 · {o.guests}人
            </Text>
            <View style={{ height: '6px' }} />
            <Text style={{ color: '#0f172a', fontSize: '12px', display: 'block' }}>
              金额 ¥{formatMoney(o.amountCents)}
            </Text>

            {o.status === 'pending_payment' && (
              <View style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <Button type="primary" loading={payMutation.isPending} onClick={() => onPay(o.id)}>模拟支付</Button>
                <Button type="default" plain loading={cancelMutation.isPending} onClick={() => onCancel(o.id)}>取消订单</Button>
              </View>
            )}
            {o.status !== 'pending_payment' && (
              <View style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button type="default" plain size="small" loading={deleteMutation.isPending} onClick={() => onDelete(o.id)}>
                  删除订单
                </Button>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }, [error, goLogin, isLoading, onCancel, onPay, onDelete, orders, cancelMutation.isPending, payMutation.isPending, deleteMutation.isPending]);

  return (
    <View style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f6f9ff' }}>
      <View
        style={{
          padding: '14px 16px',
          background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
          color: '#fff',
          fontWeight: 700,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Text>我的订单</Text>
        <Text style={{ fontSize: '12px' }} onClick={() => refetch()}>刷新</Text>
      </View>
      <ScrollView scrollY style={{ flex: 1 }}>
        {content}
      </ScrollView>
    </View>
  );
}
