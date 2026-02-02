/**
 * RN 端：自建 Popup 组件
 * 增强版：支持动画、锁定滚动、自定义遮罩
 */
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text } from '@tarojs/components';
import { rnSafeAreaBottom, rnSafeAreaTop } from '../../styles/rn-utils';
import './index.rn.scss';

export interface PopupProps {
  visible?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  round?: boolean;
  closeable?: boolean;
  closeIcon?: React.ReactNode;
  closeIconPosition?: 'top-left' | 'top-right';
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onClose?: () => void;
  onOpen?: () => void;
  onClickOverlay?: () => void;
  closeOnClickOverlay?: boolean;
  lockScroll?: boolean;
  safeAreaInsetTop?: boolean;
  safeAreaInsetBottom?: boolean;
  style?: React.CSSProperties;
  overlayStyle?: React.CSSProperties;
  className?: string;
  duration?: number;
}

export function Popup({
  visible = false,
  position = 'bottom',
  round = true,
  closeable = false,
  closeIconPosition = 'top-right',
  title,
  description,
  children,
  onClose,
  onOpen,
  onClickOverlay,
  closeOnClickOverlay = true,
  safeAreaInsetTop = false,
  safeAreaInsetBottom = true,
  style,
  overlayStyle,
  className = '',
  duration = 300,
}: PopupProps) {
  const [show, setShow] = useState(false);
  const [_animating, setAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setShow(true);
      setAnimating(true);
      onOpen?.();
      // 动画完成后
      const timer = setTimeout(() => setAnimating(false), duration);
      return () => clearTimeout(timer);
    } else {
      setAnimating(true);
      const timer = setTimeout(() => {
        setShow(false);
        setAnimating(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, onOpen, duration]);

  const handleMaskClick = useCallback(() => {
    onClickOverlay?.();
    if (closeOnClickOverlay) {
      onClose?.();
    }
  }, [onClose, onClickOverlay, closeOnClickOverlay]);

  const handleContentClick = useCallback((e: any) => {
    e.stopPropagation?.();
  }, []);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  if (!show) return null;

  const getSafeAreaStyle = (): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    if (position === 'bottom' && safeAreaInsetBottom) {
      Object.assign(styles, rnSafeAreaBottom(16));
    }
    if (position === 'top' && safeAreaInsetTop) {
      Object.assign(styles, rnSafeAreaTop(16));
    }
    return styles;
  };

  const contentAnimationClass = visible ? 'rn-popup-enter' : 'rn-popup-leave';
  const maskAnimationClass = visible ? 'rn-popup-mask-enter' : 'rn-popup-mask-leave';

  return (
    <View
      className={`rn-popup-mask ${maskAnimationClass}`}
      style={{
        animationDuration: `${duration}ms`,
        ...overlayStyle
      }}
      onClick={handleMaskClick}
    >
      <View
        className={`rn-popup-content rn-popup-${position} ${round ? 'rn-popup-round' : ''} ${contentAnimationClass} ${className}`}
        style={{
          ...getSafeAreaStyle(),
          animationDuration: `${duration}ms`,
          ...style
        }}
        onClick={handleContentClick}
      >
        {(title || closeable) && (
          <View className="rn-popup-header">
            {closeable && closeIconPosition === 'top-left' && (
              <Text className="rn-popup-close rn-popup-close-left" onClick={handleClose}>
                ✕
              </Text>
            )}
            <View className="rn-popup-header-content">
              {title && <Text className="rn-popup-title">{title}</Text>}
              {description && <Text className="rn-popup-description">{description}</Text>}
            </View>
            {closeable && closeIconPosition === 'top-right' && (
              <Text className="rn-popup-close rn-popup-close-right" onClick={handleClose}>
                ✕
              </Text>
            )}
          </View>
        )}
        <View className="rn-popup-body">{children}</View>
      </View>
    </View>
  );
}
