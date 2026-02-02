/**
 * UI 组件统一导出
 * 业务代码统一从此处引入组件，无需关心平台差异
 *
 * 使用方式：
 * import { Button, Popup, Loading, Skeleton, HotelCard } from '@/components/ui';
 */

// NutUI 组件 + RN 镜像层
export { Button } from '../Button';
export type { ButtonProps } from '../Button';

export { Popup } from '../Popup';
export type { PopupProps } from '../Popup';

export { Loading } from '../Loading';
export type { LoadingProps } from '../Loading';

export { Skeleton } from '../Skeleton';
export type { SkeletonProps } from '../Skeleton';

// 自建业务组件（三端统一实现）
export { HotelCard } from '../HotelCard';
export type { HotelCardProps } from '../HotelCard';

// 日历组件
export { default as Calendar } from '../Calendar';
