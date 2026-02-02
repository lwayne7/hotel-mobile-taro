/**
 * RN 端：自建 Button 组件，API 与 NutUI 保持一致
 * 增强版：支持涟漪效果、图标位置、更多尺寸
 */
import React, { useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import { rnShadow } from '../../styles/rn-utils';
import './index.rn.scss';

export interface ButtonProps {
  type?: 'default' | 'primary' | 'info' | 'warning' | 'danger' | 'success';
  size?: 'large' | 'normal' | 'small' | 'mini';
  shape?: 'square' | 'round';
  plain?: boolean;
  loading?: boolean;
  disabled?: boolean;
  block?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const typeColors: Record<string, { bg: string; text: string; border: string; active: string }> = {
  default: { bg: '#fff', text: '#333', border: '#eee', active: '#f5f5f5' },
  primary: { bg: '#ff6b00', text: '#fff', border: '#ff6b00', active: '#e65c00' },
  info: { bg: '#0086f6', text: '#fff', border: '#0086f6', active: '#0070d1' },
  warning: { bg: '#ff9900', text: '#fff', border: '#ff9900', active: '#e68a00' },
  danger: { bg: '#ff3b30', text: '#fff', border: '#ff3b30', active: '#e6352b' },
  success: { bg: '#34c759', text: '#fff', border: '#34c759', active: '#2db24e' },
};

const sizeConfig: Record<string, { height: number; fontSize: number; padding: number }> = {
  large: { height: 48, fontSize: 16, padding: 24 },
  normal: { height: 40, fontSize: 14, padding: 16 },
  small: { height: 32, fontSize: 12, padding: 12 },
  mini: { height: 24, fontSize: 10, padding: 8 },
};

export function Button({
  type = 'default',
  size = 'normal',
  shape = 'round',
  plain = false,
  loading = false,
  disabled = false,
  block = false,
  icon,
  iconPosition = 'left',
  children,
  onClick,
  className = '',
  style,
}: ButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const colors = typeColors[type] || typeColors.default;
  const sizeStyle = sizeConfig[size] || sizeConfig.normal;

  const handleTouchStart = useCallback(() => {
    if (!disabled && !loading) {
      setIsPressed(true);
    }
  }, [disabled, loading]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  }, [disabled, loading, onClick]);

  const buttonStyle: React.CSSProperties = {
    backgroundColor: plain ? 'transparent' : (isPressed ? colors.active : colors.bg),
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'solid',
    opacity: disabled ? 0.5 : 1,
    height: sizeStyle.height,
    paddingLeft: sizeStyle.padding,
    paddingRight: sizeStyle.padding,
    transform: isPressed ? 'scale(0.98)' : 'scale(1)',
    transition: 'transform 0.1s, background-color 0.1s',
    ...rnShadow(plain ? 0 : 2),
    ...style,
  };

  const textStyle: React.CSSProperties = {
    color: plain ? colors.bg : colors.text,
    fontSize: sizeStyle.fontSize,
  };

  const renderIcon = () => {
    if (loading) {
      return <Text className="rn-button-loading">⏳</Text>;
    }
    return icon;
  };

  return (
    <View
      className={`rn-button rn-button-${size} rn-button-${shape} ${block ? 'rn-button-block' : ''} ${className}`}
      style={buttonStyle}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {iconPosition === 'left' && renderIcon()}
      {children && (
        <Text className={`rn-button-text rn-button-text-${size}`} style={textStyle}>
          {children}
        </Text>
      )}
      {iconPosition === 'right' && renderIcon()}
    </View>
  );
}
