import { useState, useCallback } from 'react';
import { View, Text, Image } from '@tarojs/components';

/** 房型图片：主图失败用 fallback，都失败显示占位 */
export function RoomImage({ src, fallbackSrc }: { src?: string; fallbackSrc?: string }) {
  const [primaryFailed, setPrimaryFailed] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  const currentSrc = !src && fallbackSrc ? fallbackSrc : (primaryFailed ? fallbackSrc : src);
  const showPlaceholder = !currentSrc || (primaryFailed && (fallbackFailed || !fallbackSrc));

  const onError = useCallback(() => {
    if (!src && fallbackSrc) setFallbackFailed(true);
    else if (!primaryFailed) setPrimaryFailed(true);
    else setFallbackFailed(true);
  }, [primaryFailed, src, fallbackSrc]);

  if (showPlaceholder) {
    return (
      <View className="room-thumb-placeholder">
        <Text>🛏️</Text>
      </View>
    );
  }

  return (
    <Image
      src={currentSrc!}
      mode="aspectFill"
      className="ctrip-detail-room-thumb-img"
      onError={onError}
    />
  );
}
