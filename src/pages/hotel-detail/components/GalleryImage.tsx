import { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';

/** Gallery 图片组件 - 无图/加载失败显示占位 */
export function GalleryImage({
  src,
  onClick
}: {
  src?: string;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const normalizedSrc = src?.trim?.();
  const showPlaceholder = !normalizedSrc || failed;

  if (showPlaceholder) {
    return (
      <View className="ctrip-detail-slide-placeholder">
        <Text className="ctrip-detail-slide-placeholder-text">暂无图片</Text>
      </View>
    );
  }

  return (
    <Image
      src={normalizedSrc!}
      mode="aspectFill"
      className="ctrip-detail-slide-img"
      onError={() => setFailed(true)}
      onClick={onClick}
    />
  );
}
