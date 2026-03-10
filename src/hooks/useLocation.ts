import { useCallback, useState } from 'react';
import Taro from '@tarojs/taro';
import { platform } from '../styles/rn-utils';

interface UseLocationOptions {
  /**
   * 定位成功时回调，传出推断出的城市名称
   */
  onCityDetected?: (city: string) => void;
  /**
   * 当前环境不支持定位时回调（例如 H5 非 HTTPS）
   */
  onUnsupported?: (reason?: string) => void;
  /**
   * 调用定位失败时回调
   */
  onError?: (error: any) => void;
}

interface LocationSupportResult {
  supported: boolean;
  reason?: string;
}

function checkLocationSupport(): LocationSupportResult {
  if (platform.isH5) {
    // 浏览器仅在「安全上下文」下允许定位：HTTPS 或 localhost/127.0.0.1
    // 局域网 IP（如 10.x、192.168.x）即使用 HTTP 我们放行，浏览器也会拒绝，故直接提示
    if (typeof window !== 'undefined' && window.location) {
      const { protocol, hostname } = window.location;
      const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1';
      const isHttps = protocol === 'https:';
      if (!isHttps && !isLoopback) {
        const isLan = /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) || /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname);
        const reason = isLan
          ? '当前为局域网地址，浏览器不允许在此环境下定位，请用 localhost 或 127.0.0.1 访问后重试，或手动选择城市'
          : 'H5定位需要HTTPS环境，当前为HTTP';
        return { supported: false, reason };
      }
      if (!navigator.geolocation) {
        return { supported: false, reason: '浏览器不支持定位功能' };
      }
    }
  }
  return { supported: true };
}

function detectCityByLongitude(longitude: number): string {
  let detectedCity = '上海';
  if (longitude < 105) detectedCity = '成都';
  else if (longitude < 113) detectedCity = '武汉';
  else if (longitude < 114) detectedCity = '广州';
  else if (longitude < 115) detectedCity = '深圳';
  else if (longitude < 117) detectedCity = '杭州';
  else if (longitude < 120) detectedCity = '南京';
  else if (longitude < 122) detectedCity = '上海';
  else detectedCity = '北京';
  return detectedCity;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { onCityDetected, onUnsupported, onError } = options;
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleGpsLocation = useCallback(() => {
    if (gpsLoading) return;

    const locationCheck = checkLocationSupport();
    if (!locationCheck.supported) {
      onUnsupported?.(locationCheck.reason);
      const msg = locationCheck.reason || '定位不可用';
      if (msg.includes('局域网')) {
        Taro.showModal({ title: '无法使用定位', content: msg, showCancel: false, confirmText: '知道了' });
      } else {
        Taro.showToast({ title: msg, icon: 'none', duration: 2500 });
      }
      return;
    }

    setGpsLoading(true);

    if (platform.isH5) {
      // H5 环境使用原生 geolocation API
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLoading(false);
          const { longitude } = position.coords;
          const city = detectCityByLongitude(longitude);
          onCityDetected?.(city);
          Taro.showToast({ title: `已定位到: ${city}`, icon: 'none' });
        },
        (err) => {
          setGpsLoading(false);
          if (err.code === 1) {
            // 用户或浏览器拒绝了定位权限，提示在地址栏/设置中允许后重试
            Taro.showModal({
              title: '定位未开启',
              content: '请在浏览器地址栏点击锁/盾图标，允许位置权限后重新点击定位；或直接手动选择城市。',
              showCancel: false,
              confirmText: '知道了',
            });
          } else {
            let msg = err.code === 2 ? '无法获取位置信息' : err.code === 3 ? '定位超时' : '定位失败';
            Taro.showToast({ title: `${msg}，请手动选择`, icon: 'none', duration: 2500 });
          }
          onError?.(err);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      // 小程序 / RN 环境：先检查并请求定位权限，再调用 getLocation
      const requestLocation = () => {
        Taro.getLocation({
          type: 'wgs84',
          success: (res) => {
            setGpsLoading(false);
            const { longitude } = res;
            const city = detectCityByLongitude(longitude);
            onCityDetected?.(city);
            Taro.showToast({ title: `已定位到: ${city}`, icon: 'none' });
          },
          fail: (err: any) => {
            setGpsLoading(false);
            const msg =
              err?.errMsg?.includes('auth deny') || err?.errMsg?.includes('authorize')
                ? '未授权定位，请手动选择城市'
                : err?.errMsg?.includes('timeout')
                  ? '定位超时，请手动选择'
                  : '定位失败，请手动选择';
            Taro.showToast({ title: msg, icon: 'none', duration: 2500 });
            onError?.(err);
          },
        });
      };

      if (platform.isWeapp) {
        Taro.getSetting()
          .then((setting): Promise<unknown> => {
            if (setting.authSetting['scope.userLocation'] === true) {
              requestLocation();
              return Promise.resolve('granted');
            }
            if (setting.authSetting['scope.userLocation'] === false) {
              Taro.showModal({
                title: '需要定位权限',
                content: '请在设置中开启位置信息，以便展示当前城市酒店',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) Taro.openSetting();
                  setGpsLoading(false);
                },
              });
              return Promise.resolve('denied');
            }
            return Taro.authorize({ scope: 'scope.userLocation' });
          })
          .then((authRes: any) => {
            if (authRes === 'granted' || authRes === 'denied') return;
            if (authRes?.errMsg?.includes('ok')) {
              requestLocation();
            } else {
              setGpsLoading(false);
              Taro.showToast({ title: '未授权定位，请手动选择', icon: 'none' });
            }
          })
          .catch(() => {
            setGpsLoading(false);
            Taro.showToast({ title: '定位失败，请手动选择', icon: 'none' });
          });
      } else {
        requestLocation();
      }
    }
  }, [gpsLoading, onCityDetected, onUnsupported, onError]);

  return {
    gpsLoading,
    handleGpsLocation,
  };
}

