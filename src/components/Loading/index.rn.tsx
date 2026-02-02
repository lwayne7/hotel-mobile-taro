/**
 * RN 端：自建 Loading 组件
 * 增强版：支持全屏遮罩、自定义图标、更多动画效果
 */
import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.rn.scss';

export interface LoadingProps {
  type?: 'circular' | 'spinner' | 'dot';
  color?: string;
  size?: 'small' | 'normal' | 'large' | string | number;
  children?: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  icon?: React.ReactNode;
  fullscreen?: boolean;
  background?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Loading({
  type = 'circular',
  color = '#ff6b00',
  size = 'normal',
  children,
  direction = 'horizontal',
  icon,
  fullscreen = false,
  background = 'rgba(255, 255, 255, 0.9)',
  className = '',
  style,
}: LoadingProps) {
  const getSizeValue = (): number => {
    if (typeof size === 'number') return size;
    if (typeof size === 'string') {
      const parsed = parseInt(size, 10);
      if (!isNaN(parsed)) return parsed;
    }
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 32;
      default:
        return 24;
    }
  };

  const sizeValue = getSizeValue();

  const renderIcon = () => {
    if (icon) return icon;

    if (type === 'dot') {
      return (
        <View className="rn-loading-dots">
          <View className="rn-loading-dot" style={{ backgroundColor: color }} />
          <View className="rn-loading-dot rn-loading-dot-2" style={{ backgroundColor: color }} />
          <View className="rn-loading-dot rn-loading-dot-3" style={{ backgroundColor: color }} />
        </View>
      );
    }

    return (
      <View
        className={`rn-loading-icon rn-loading-${type}`}
        style={{
          width: sizeValue,
          height: sizeValue,
          borderColor: color,
          borderTopColor: type === 'circular' ? 'transparent' : color,
        }}
      />
    );
  };

  const content = (
    <View
      className={`rn-loading rn-loading-${direction} ${className}`}
      style={style}
    >
      {renderIcon()}
      {children && (
        <Text 
          className="rn-loading-text" 
          style={{ 
            color,
            marginLeft: direction === 'horizontal' ? 8 : 0,
            marginTop: direction === 'vertical' ? 8 : 0,
          }}
        >
          {children}
        </Text>
      )}
    </View>
  );

  if (fullscreen) {
    return (
      <View className="rn-loading-fullscreen" style={{ backgroundColor: background }}>
        {content}
      </View>
    );
  }

  return content;
}
