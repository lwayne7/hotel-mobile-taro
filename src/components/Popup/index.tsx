/**
 * Popup 组件 - H5/小程序统一实现
 * 不依赖 NutUI，确保跨平台兼容性
 */
import React, { useEffect, useState } from 'react';
import { View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

export interface PopupProps {
  visible?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  round?: boolean;
  closeable?: boolean;
  closeIcon?: string;
  closeIconPosition?: 'top-left' | 'top-right';
  destroyOnClose?: boolean;
  overlay?: boolean;
  overlayClosable?: boolean;
  lockScroll?: boolean;
  zIndex?: number;
  duration?: number;
  children?: React.ReactNode;
  onClose?: () => void;
  onOpen?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const isH5 = process.env.TARO_ENV === 'h5';

export function Popup({
  visible = false,
  position = 'center',
  round = true,
  closeable = false,
  closeIconPosition = 'top-right',
  destroyOnClose = false,
  overlay = true,
  overlayClosable = true,
  lockScroll = true,
  zIndex = 1000,
  duration = 300,
  children,
  onClose,
  onOpen,
  className = '',
  style,
}: PopupProps) {
  const [showContent, setShowContent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowContent(true);
      setIsAnimating(true);
      onOpen?.();
      // 防止滚动穿透 - 仅 H5 环境
      if (lockScroll && isH5 && typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }
      // 小程序使用 pageScrollTo 或 catchMove 阻止滚动
      if (lockScroll && !isH5) {
        Taro.pageScrollTo?.({ scrollTop: 0, duration: 0 });
      }
      setTimeout(() => setIsAnimating(false), 50);
    } else {
      setIsAnimating(true);
      if (lockScroll && isH5 && typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
      setTimeout(() => {
        setIsAnimating(false);
        if (destroyOnClose) {
          setShowContent(false);
        }
      }, duration);
    }
    return () => {
      if (isH5 && typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [visible, destroyOnClose, duration, lockScroll, onOpen]);

  const handleOverlayClick = () => {
    if (overlayClosable) {
      onClose?.();
    }
  };

  const handleContentClick = (e: any) => {
    e.stopPropagation();
  };

  if (!showContent && !visible) return null;

  const positionClass = `ht-popup--${position}`;
  const visibleClass = visible && !isAnimating ? 'ht-popup--visible' : '';
  const roundClass = round && (position === 'bottom' || position === 'top') ? 'ht-popup--round' : '';

  return (
    <View
      className={`ht-popup-wrapper ${visible ? 'ht-popup-wrapper--visible' : ''}`}
      style={{ zIndex }}
      catchMove={lockScroll}
    >
      {overlay && (
        <View
          className={`ht-popup-overlay ${visible && !isAnimating ? 'ht-popup-overlay--visible' : ''}`}
          onClick={handleOverlayClick}
          style={{ transitionDuration: `${duration}ms` }}
        />
      )}
      <View
        className={`ht-popup ${positionClass} ${visibleClass} ${roundClass} ${className}`}
        style={{ ...style, transitionDuration: `${duration}ms` }}
        onClick={handleContentClick}
      >
        {closeable && (
          <View
            className={`ht-popup-close ht-popup-close--${closeIconPosition}`}
            onClick={onClose}
          >
            ✕
          </View>
        )}
        {children}
      </View>
    </View>
  );
}
