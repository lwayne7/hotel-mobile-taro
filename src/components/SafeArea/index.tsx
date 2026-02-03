import React from 'react';
import { View } from '@tarojs/components';
import { platform, rnSafeAreaBottom, rnSafeAreaTop } from '../../styles/rn-utils';

type Edge = 'top' | 'bottom';

export interface SafeAreaProps {
  edges?: Edge[];
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * SafeArea 容器组件
 * - RN 端：使用 rnSafeAreaTop/Bottom 计算安全区域内边距
 * - H5 / 小程序：仅透传样式，不做额外处理
 */
export function SafeArea({ edges = ['bottom'], className = '', style, children }: SafeAreaProps) {
  let paddingStyle: React.CSSProperties = {};

  if (platform.isRN) {
    if (edges.includes('top')) {
      paddingStyle = { ...paddingStyle, ...rnSafeAreaTop(0) };
    }
    if (edges.includes('bottom')) {
      paddingStyle = { ...paddingStyle, ...rnSafeAreaBottom(0) };
    }
  }

  return (
    <View className={className} style={{ ...paddingStyle, ...style }}>
      {children}
    </View>
  );
}

