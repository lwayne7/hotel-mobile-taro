/** 我的订单（演示：下单/取消/模拟支付回调幂等） */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { Button, Skeleton } from '../../components/ui';
import { orderApi, paymentApi } from '../../services/api';
import type { Order, OrderStatus } from '../../types/order';

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
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderApi.mine({ page: 1, pageSize: 20 });
      setOrders(res.data || []);
    } catch (e: any) {
      setOrders([]);
      setError(e?.message || '加载失败（可能未登录）');
    } finally {
      setLoading(false);
    }
  }, []);

  useDidShow(() => {
    fetchOrders();
  });

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onCancel = useCallback(async (id: number) => {
    try {
      await orderApi.cancel(id);
      Taro.showToast({ title: '已取消', icon: 'none' });
      fetchOrders();
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '取消失败', icon: 'none' });
    }
  }, [fetchOrders]);

  const onPay = useCallback(async (orderId: number) => {
    const now = new Date();
    const eventId = `evt_${now.getTime()}_${Math.random().toString(16).slice(2, 8)}`;
    try {
      await paymentApi.callback({
        eventId,
        orderId,
        paymentNo: `pay_${Math.random().toString(16).slice(2, 10)}`,
        paidAt: now.toISOString(),
      });
      Taro.showToast({ title: '模拟支付回调成功', icon: 'none' });
      fetchOrders();
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '支付回调失败', icon: 'none' });
    }
  }, [fetchOrders]);

  const onDelete = useCallback(async (orderId: number) => {
    try {
      await orderApi.remove(orderId);
      Taro.showToast({ title: '已删除', icon: 'none' });
      fetchOrders();
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '删除失败', icon: 'none' });
    }
  }, [fetchOrders]);

  const goLogin = useCallback(() => {
    Taro.navigateTo({
      url: `/pages/login/index?redirect=${encodeURIComponent('/pages/orders/index')}`,
    });
  }, []);

  const content = useMemo(() => {
    if (loading) {
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
          <Text style={{ color: '#64748b', fontSize: '13px' }}>{error}</Text>
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
                <Button type="primary" onClick={() => onPay(o.id)}>模拟支付</Button>
                <Button type="default" plain onClick={() => onCancel(o.id)}>取消订单</Button>
              </View>
            )}
            {o.status !== 'pending_payment' && (
              <View style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <Button type="default" plain size="small" onClick={() => onDelete(o.id)}>
                  删除订单
                </Button>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }, [error, goLogin, loading, onCancel, onPay, orders]);

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
        <Text style={{ fontSize: '12px' }} onClick={fetchOrders}>刷新</Text>
      </View>
      <ScrollView scrollY style={{ flex: 1 }}>
        {content}
      </ScrollView>
    </View>
  );
}

