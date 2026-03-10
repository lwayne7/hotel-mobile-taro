import type { RoomType } from '../../../types/hotel';

export const ROOM_FILTER_TAGS = ['含早餐', '立即确认', '大床房', '双床房', '免费取消', '筛选'];

/** 设施名称 → 语义图标映射 */
export const FEATURE_ICON_MAP: Record<string, string> = {
  '免费WiFi': '📶', 'WiFi': '📶', '无线网络': '📶',
  '停车场': '🅿️', '免费停车': '🅿️',
  '游泳池': '🏊', '泳池': '🏊', '室内泳池': '🏊', '室外泳池': '🏊',
  '健身房': '💪', '健身中心': '💪',
  '餐厅': '🍽️', '中餐厅': '🍽️', '西餐厅': '🍽️', '自助餐': '🍽️',
  '酒吧': '🍸', '大堂吧': '🍸',
  'SPA': '💆', '水疗': '💆',
  '会议室': '📋', '商务中心': '📋',
  '儿童乐园': '🎠', '亲子': '🎠',
  '24小时前台': '🛎️', '24h前台': '🛎️', '前台': '🛎️',
  '行李寄存': '🧳',
  '洗衣服务': '👔', '洗衣房': '👔',
  '新中式风': '🏮', '中式': '🏮',
  '花园': '🌿', '露台': '🌿',
  '接机服务': '✈️', '机场接送': '✈️',
};

export function matchRoomByFilter(room: RoomType, filter: string | null): boolean {
  if (!filter) return true;
  const bedType = (room.bedType ?? '').toLowerCase();
  const amenities = (room.amenities ?? []).map((a) => String(a).toLowerCase());
  const roomName = (room.name ?? '').toLowerCase();
  switch (filter) {
    case '含早餐':
      return amenities.some((a) => a.includes('早餐') || a.includes('含早'));
    case '立即确认':
      return amenities.some((a) => a.includes('立即确认') || a.includes('闪订'));
    case '大床房':
      return bedType.includes('大床') || roomName.includes('大床');
    case '双床房':
      return bedType.includes('双床') || bedType.includes('标准') || roomName.includes('双床') || roomName.includes('标准');
    case '免费取消':
      return amenities.some((a) => a.includes('免费取消') || a.includes('可取消'));
    default:
      return true;
  }
}
