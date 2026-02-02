/**
 * Button 组件 - H5/小程序统一实现
 * 不依赖 NutUI，确保跨平台兼容性
 */
import React from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

export interface ButtonProps {
  type?: 'default' | 'primary' | 'info' | 'warning' | 'danger' | 'success';
  size?: 'large' | 'normal' | 'small' | 'mini';
  shape?: 'square' | 'round';
  plain?: boolean;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Button({
  type = 'default',
  size = 'normal',
  shape = 'round',
  plain = false,
  loading = false,
  disabled = false,
  block = false,
  icon,
  children,
  onClick,
  className = '',
  style,
}: ButtonProps) {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  const classNames = [
    'ht-btn',
    `ht-btn--${type}`,
    `ht-btn--${size}`,
    `ht-btn--${shape}`,
    plain ? 'ht-btn--plain' : '',
    block ? 'ht-btn--block' : '',
    disabled ? 'ht-btn--disabled' : '',
    loading ? 'ht-btn--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <View className={classNames} style={style} onClick={handleClick}>
      {loading && <Text className="ht-btn-loading">⏳</Text>}
      {icon && !loading && <View className="ht-btn-icon">{icon}</View>}
      <Text className="ht-btn-text">{children}</Text>
    </View>
  );
}
