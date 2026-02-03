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
    // H5 环境下检查是否是 HTTPS
    if (typeof window !== 'undefined' && window.location) {
      const isSecure =
        window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        return { supported: false, reason: 'H5定位需要HTTPS环境，当前为HTTP' };
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
      Taro.showToast({
        title: locationCheck.reason || '定位不可用',
        icon: 'none',
        duration: 2500,
      });
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
          let msg = '定位失败';
          if (err.code === 1) msg = '定位权限被拒绝';
          else if (err.code === 2) msg = '无法获取位置信息';
          else if (err.code === 3) msg = '定位超时';
          Taro.showToast({ title: `${msg}，请手动选择`, icon: 'none' });
          onError?.(err);
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    } else {
      // 小程序 / RN 环境
      Taro.getLocation({
        type: 'wgs84',
        success: (res) => {
          setGpsLoading(false);
          const { longitude } = res;
          const city = detectCityByLongitude(longitude);
          onCityDetected?.(city);
          Taro.showToast({ title: `已定位到: ${city}`, icon: 'none' });
        },
        fail: (err) => {
          setGpsLoading(false);
          Taro.showToast({ title: '定位失败，请手动选择', icon: 'none' });
          onError?.(err);
        },
      });
    }
  }, [gpsLoading, onCityDetected]);

  return {
    gpsLoading,
    handleGpsLocation,
  };
}

