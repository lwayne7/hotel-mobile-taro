import { useMemo } from 'react';
import Taro from '@tarojs/taro';

/** 是否为微信小程序环境（用于 weapp 与 H5/RN 分支） */
export function useIsWeapp(): boolean {
  return useMemo(() => {
    try {
      const env = (Taro as { getEnv?: () => string; ENV_TYPE?: { WEAPP: string } }).getEnv?.();
      const weapp = (Taro as { ENV_TYPE?: { WEAPP: string } }).ENV_TYPE?.WEAPP;
      return env === weapp;
    } catch {
      return process.env.TARO_ENV === 'weapp';
    }
  }, []);
}
