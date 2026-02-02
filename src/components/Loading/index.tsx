/**
 * Loading 组件 - H5/小程序统一实现
 * 不依赖 NutUI，确保跨平台兼容性
 */
import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

export interface LoadingProps {
  type?: 'circular' | 'spinner';
  size?: 'small' | 'normal' | 'large';
  color?: string;
  direction?: 'horizontal' | 'vertical';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Loading({
  type = 'circular',
  size = 'normal',
  color,
  direction = 'horizontal',
  children,
  className = '',
  style,
}: LoadingProps) {
  const sizeMap = {
    small: 16,
    normal: 24,
    large: 36,
  };

  const iconSize = sizeMap[size];

  return (
    <View
      className={`ht-loading ht-loading--${direction} ${className}`}
      style={style}
    >
      <View
        className={`ht-loading-icon ht-loading-icon--${type}`}
        style={{
          width: iconSize,
          height: iconSize,
          borderColor: color || undefined,
        }}
      />
      {children && <Text className="ht-loading-text">{children}</Text>}
    </View>
  );
}

export default Loading;
