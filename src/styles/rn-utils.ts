import Taro from '@tarojs/taro';

/**
 * RN 端样式工具函数
 * 用于处理 RN 端不支持的 CSS 特性
 */

const isRN = process.env.TARO_ENV === 'rn';

// ============ 颜色常量（与 tokens.scss 保持同步）============
export const colors = {
  primary: '#ff6b00',
  primaryLight: '#ff8533',
  primaryDark: '#e85c0d',
  blue: '#0086f6',
  blueDark: '#006ed3',
  blueLight: '#e6f4ff',
  bg: '#f5f5f5',
  bgPage: '#f5f7fa',
  card: '#fff',
  border: '#f2f2f2',
  price: '#ff6b00',
  text: '#333',
  textSecondary: '#666',
  textPlaceholder: '#999',
};

// ============ 间距常量 ============
export const spacing = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
};

// ============ 字号常量（实际像素）============
export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
};

// ============ RN Shadow 样式 ============
export interface ShadowStyle {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

/**
 * 生成 RN 端阴影样式
 * @param elevation Android elevation 值，同时影响 iOS 阴影强度
 */
export function rnShadow(elevation: number = 4): ShadowStyle {
  if (!isRN) return {};

  return {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: Math.floor(elevation / 2) },
    shadowOpacity: 0.1 + elevation * 0.02,
    shadowRadius: elevation,
    elevation,
  };
}

/**
 * 生成轻量阴影
 */
export function rnShadowSm(): ShadowStyle {
  return rnShadow(2);
}

/**
 * 生成中等阴影
 */
export function rnShadowMd(): ShadowStyle {
  return rnShadow(4);
}

/**
 * 生成大阴影
 */
export function rnShadowLg(): ShadowStyle {
  return rnShadow(8);
}

// ============ 安全区域 ============
interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

let cachedSafeArea: SafeAreaInsets | null = null;

/**
 * 获取安全区域 insets
 */
export function getSafeAreaInsets(): SafeAreaInsets {
  if (cachedSafeArea) return cachedSafeArea;

  try {
    const systemInfo = Taro.getSystemInfoSync();
    cachedSafeArea = {
      top: systemInfo.safeArea?.top || 0,
      bottom: (systemInfo.screenHeight || 0) - (systemInfo.safeArea?.bottom || systemInfo.screenHeight || 0),
      left: systemInfo.safeArea?.left || 0,
      right: (systemInfo.screenWidth || 0) - (systemInfo.safeArea?.right || systemInfo.screenWidth || 0),
    };
  } catch {
    cachedSafeArea = { top: 0, bottom: 0, left: 0, right: 0 };
  }

  return cachedSafeArea;
}

/**
 * 生成底部安全区域 padding
 */
export function rnSafeAreaBottom(extraPadding: number = 0): { paddingBottom: number } {
  if (!isRN) return { paddingBottom: extraPadding };
  const insets = getSafeAreaInsets();
  return { paddingBottom: insets.bottom + extraPadding };
}

/**
 * 生成顶部安全区域 padding
 */
export function rnSafeAreaTop(extraPadding: number = 0): { paddingTop: number } {
  if (!isRN) return { paddingTop: extraPadding };
  const insets = getSafeAreaInsets();
  return { paddingTop: insets.top + extraPadding };
}

// ============ 平台判断 ============
export const platform = {
  isRN,
  isH5: process.env.TARO_ENV === 'h5',
  isWeapp: process.env.TARO_ENV === 'weapp',
};

// ============ 条件样式 ============
/**
 * 根据平台返回不同样式
 */
export function platformStyle<T>(options: {
  default: T;
  rn?: T;
  h5?: T;
  weapp?: T;
}): T {
  if (isRN && options.rn !== undefined) return options.rn;
  if (platform.isH5 && options.h5 !== undefined) return options.h5;
  if (platform.isWeapp && options.weapp !== undefined) return options.weapp;
  return options.default;
}
