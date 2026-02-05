/**
 * Taro 存储适配器，供 Zustand persist 使用
 * 与 zustand createJSONStorage 配合，实现多端持久化
 */
import Taro from '@tarojs/taro';

export const taroStorage = {
  getItem: (name: string): string | null => {
    try {
      return Taro.getStorageSync(name) || null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    try {
      Taro.setStorageSync(name, value);
    } catch {
      // 忽略存储失败
    }
  },
  removeItem: (name: string): void => {
    try {
      Taro.removeStorageSync(name);
    } catch {
      // 忽略
    }
  },
};
