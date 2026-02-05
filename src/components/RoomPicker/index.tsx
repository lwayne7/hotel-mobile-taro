import { View, Text } from '@tarojs/components';
import { Popup } from '../ui';
import './index.scss';

export interface RoomPickerProps {
    visible: boolean;
    rooms: number;
    adults: number;
    children: number;
    onClose: () => void;
    onRoomsChange: (value: number) => void;
    onAdultsChange: (value: number) => void;
    onChildrenChange: (value: number) => void;
}

/**
 * 房间人数选择弹窗组件
 * 支持房间数、成人数、儿童数的增减选择
 */
export function RoomPicker({
    visible,
    rooms,
    adults,
    children,
    onClose,
    onRoomsChange,
    onAdultsChange,
    onChildrenChange,
}: RoomPickerProps) {
    return (
        <Popup visible={visible} onClose={onClose} position="bottom" round>
            <View className="room-picker">
                <View className="room-picker-header">
                    <Text className="room-picker-title">选择房间与人数</Text>
                    <Text className="room-picker-close" onClick={onClose}>×</Text>
                </View>

                <View className="room-picker-row">
                    <Text className="room-picker-label">房间</Text>
                    <View className="room-picker-stepper">
                        <Text
                            className="stepper-btn"
                            onClick={() => onRoomsChange(Math.max(1, rooms - 1))}
                        >
                            -
                        </Text>
                        <Text className="stepper-value">{rooms}</Text>
                        <Text
                            className="stepper-btn"
                            onClick={() => onRoomsChange(Math.min(10, rooms + 1))}
                        >
                            +
                        </Text>
                    </View>
                </View>

                <View className="room-picker-row">
                    <Text className="room-picker-label">成人</Text>
                    <View className="room-picker-stepper">
                        <Text
                            className="stepper-btn"
                            onClick={() => onAdultsChange(Math.max(1, adults - 1))}
                        >
                            -
                        </Text>
                        <Text className="stepper-value">{adults}</Text>
                        <Text
                            className="stepper-btn"
                            onClick={() => onAdultsChange(Math.min(20, adults + 1))}
                        >
                            +
                        </Text>
                    </View>
                </View>

                <View className="room-picker-row">
                    <Text className="room-picker-label">儿童</Text>
                    <View className="room-picker-stepper">
                        <Text
                            className="stepper-btn"
                            onClick={() => onChildrenChange(Math.max(0, children - 1))}
                        >
                            -
                        </Text>
                        <Text className="stepper-value">{children}</Text>
                        <Text
                            className="stepper-btn"
                            onClick={() => onChildrenChange(Math.min(10, children + 1))}
                        >
                            +
                        </Text>
                    </View>
                </View>

                <View className="room-picker-confirm">
                    <Text className="room-picker-confirm-btn" onClick={onClose}>
                        确定
                    </Text>
                </View>
            </View>
        </Popup>
    );
}

export default RoomPicker;
