/**
 * RN 端：自建 Skeleton 骨架屏组件
 * 增强版：支持更多配置项、自定义模板
 */
import React from 'react';
import { View } from '@tarojs/components';
import './index.rn.scss';

export interface SkeletonProps {
  loading?: boolean;
  rows?: number;
  title?: boolean;
  avatar?: boolean;
  avatarSize?: 'small' | 'normal' | 'large' | string | number;
  avatarShape?: 'round' | 'square';
  animated?: boolean;
  round?: boolean;
  rowWidth?: (string | number)[];
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// 预设模板
export interface SkeletonImageProps {
  width?: number | string;
  height?: number | string;
  animated?: boolean;
}

export function SkeletonImage({
  width = '100%',
  height = 200,
  animated = true,
}: SkeletonImageProps) {
  return (
    <View
      className={`rn-skeleton-image ${animated ? 'rn-skeleton-animated' : ''}`}
      style={{ width, height }}
    />
  );
}

export interface SkeletonParagraphProps {
  rows?: number;
  rowWidth?: (string | number)[];
  animated?: boolean;
}

export function SkeletonParagraph({
  rows = 3,
  rowWidth,
  animated = true,
}: SkeletonParagraphProps) {
  const getRowWidth = (index: number): string | number => {
    if (rowWidth && rowWidth[index] !== undefined) {
      return rowWidth[index];
    }
    // 默认最后一行 60%
    return index === rows - 1 ? '60%' : '100%';
  };

  return (
    <View className={`rn-skeleton-paragraph ${animated ? 'rn-skeleton-animated' : ''}`}>
      {Array.from({ length: rows }).map((_, index) => (
        <View
          key={index}
          className="rn-skeleton-row"
          style={{ width: getRowWidth(index) }}
        />
      ))}
    </View>
  );
}

export function Skeleton({
  loading = true,
  rows = 3,
  title = true,
  avatar = false,
  avatarSize = 'normal',
  avatarShape = 'round',
  animated = true,
  round = false,
  rowWidth,
  children,
  className = '',
  style,
}: SkeletonProps) {
  if (!loading) {
    return <>{children}</>;
  }

  const getAvatarSize = (): number => {
    if (typeof avatarSize === 'number') return avatarSize;
    if (typeof avatarSize === 'string') {
      const parsed = parseInt(avatarSize, 10);
      if (!isNaN(parsed)) return parsed;
    }
    switch (avatarSize) {
      case 'small':
        return 32;
      case 'large':
        return 64;
      default:
        return 48;
    }
  };

  const getRowWidth = (index: number): string | number => {
    if (rowWidth && rowWidth[index] !== undefined) {
      return rowWidth[index];
    }
    return index === rows - 1 ? '60%' : '100%';
  };

  const size = getAvatarSize();

  return (
    <View 
      className={`rn-skeleton ${animated ? 'rn-skeleton-animated' : ''} ${round ? 'rn-skeleton-round' : ''} ${className}`} 
      style={style}
    >
      {avatar && (
        <View
          className={`rn-skeleton-avatar ${avatarShape === 'round' ? 'rn-skeleton-avatar-round' : ''}`}
          style={{ width: size, height: size }}
        />
      )}
      <View className="rn-skeleton-content">
        {title && <View className="rn-skeleton-title" />}
        {rows > 0 && Array.from({ length: rows }).map((_, index) => (
          <View
            key={index}
            className="rn-skeleton-row"
            style={{ width: getRowWidth(index) }}
          />
        ))}
      </View>
    </View>
  );
}

// 命名导出子组件
Skeleton.Image = SkeletonImage;
Skeleton.Paragraph = SkeletonParagraph;
