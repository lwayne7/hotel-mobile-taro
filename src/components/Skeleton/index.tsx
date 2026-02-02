/**
 * Skeleton 骨架屏组件 - H5/小程序统一实现
 * 不依赖 NutUI，确保跨平台兼容性
 */
import React from 'react';
import { View } from '@tarojs/components';
import './index.scss';

export interface SkeletonProps {
  loading?: boolean;
  rows?: number;
  avatar?: boolean;
  avatarSize?: number | string;
  avatarShape?: 'round' | 'square';
  title?: boolean;
  animated?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  loading = true,
  rows = 3,
  avatar = false,
  avatarSize = 50,
  avatarShape = 'round',
  title = false,
  animated = true,
  className = '',
  style,
  children,
}) => {
  // 如果不在 loading 状态，直接渲染 children
  if (!loading && children) {
    return <>{children}</>;
  }

  if (!loading) return null;

  const avatarSizeNum = typeof avatarSize === 'string' ? parseInt(avatarSize, 10) : avatarSize;

  return (
    <View
      className={`ht-skeleton ${animated ? 'ht-skeleton--animated' : ''} ${className}`}
      style={style}
    >
      {avatar && (
        <View
          className={`ht-skeleton-avatar ht-skeleton-avatar--${avatarShape}`}
          style={{ width: avatarSizeNum, height: avatarSizeNum }}
        />
      )}
      <View className="ht-skeleton-content">
        {title && <View className="ht-skeleton-title" />}
        {Array.from({ length: rows }).map((_, index) => (
          <View
            key={index}
            className="ht-skeleton-row"
            style={{ width: index === rows - 1 ? '60%' : '100%' }}
          />
        ))}
      </View>
    </View>
  );
};

export default Skeleton;
