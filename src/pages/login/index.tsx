/** 登录页（用于订单闭环演示：customer01 / Cust123456） */
import { useCallback, useMemo, useState } from 'react';
import { View, Text, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import { Button } from '../../components/ui';
import { authApi } from '../../services/api';
import './index.scss';

const TOKEN_STORAGE_KEY = 'TARO_APP_TOKEN';

export default function LoginPage() {
  const router = useRouter();
  const redirect = useMemo(() => {
    const r = router.params?.redirect;
    return typeof r === 'string' && r.trim() ? decodeURIComponent(r) : '/pages/index/index';
  }, [router.params?.redirect]);

  const [username, setUsername] = useState('customer01');
  const [password, setPassword] = useState('Cust123456');
  const [loading, setLoading] = useState(false);

  const onLogin = useCallback(async () => {
    if (!username.trim() || !password.trim()) {
      Taro.showToast({ title: '请输入用户名和密码', icon: 'none' });
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ username: username.trim(), password: password.trim() });
      Taro.setStorageSync(TOKEN_STORAGE_KEY, res.access_token);
      Taro.showToast({ title: '登录成功', icon: 'none' });
      // 让调用方可继续“下单”
      setTimeout(() => {
        Taro.redirectTo({ url: redirect }).catch(() => Taro.switchTab?.({ url: redirect } as any));
      }, 300);
    } catch (e: any) {
      Taro.showToast({ title: e?.message || '登录失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  }, [password, redirect, username]);

  return (
    <View className="login-page">
      <View className="login-card">
        <View className="login-header">
          <Text className="login-title">登录</Text>
          <Text className="login-badge">演示环境</Text>
        </View>
        <Text className="login-subtitle">
          使用演示账号体验「下单-取消-支付回调幂等」等完整闭环。
        </Text>

        <View className="login-field">
          <Text className="login-label">用户名</Text>
          <Input
            className="login-input"
            value={username}
            onInput={(e) => setUsername(e.detail.value)}
            placeholder="customer01"
          />
          <Text className="login-hint">建议使用已种子初始化的 customer01 / Cust123456</Text>
        </View>

        <View className="login-field">
          <Text className="login-label">密码</Text>
          <Input
            className="login-input"
            value={password}
            password
            onInput={(e) => setPassword(e.detail.value)}
            placeholder="密码"
          />
        </View>

        <Button type="primary" block loading={loading} onClick={onLogin}>
          登录
        </Button>

        <View className="login-footer">
          <Text>仅用于学习演示，不会产生真实交易。</Text>
        </View>
      </View>
    </View>
  );
}

