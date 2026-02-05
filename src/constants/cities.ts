/**
 * 统一城市配置 - 与后端种子数据 backend/seeds/config/constants.ts 对齐
 * 保证查询/列表页选择城市后能命中种子数据
 */

// 与后端 CITIES 结构一致（50 城）
const CITIES = {
  tier1: ['北京', '上海', '广州', '深圳'],
  newTier1: [
    '杭州', '成都', '重庆', '西安', '苏州', '南京', '武汉', '长沙',
    '东莞', '佛山', '宁波', '郑州', '青岛', '沈阳', '天津',
  ],
  tourist: [
    '三亚', '厦门', '大连', '桂林', '丽江', '昆明', '哈尔滨',
    '张家界', '黄山', '九寨沟', '敦煌', '拉萨', '大理', '北海', '威海',
  ],
  capital: [
    '济南', '合肥', '福州', '南昌', '贵阳', '南宁', '无锡',
    '珠海', '汕头', '惠州', '中山', '烟台', '常州', '徐州', '温州', '嘉兴',
  ],
};

/** 全部城市扁平列表（50 个，与种子数据一致） */
export const ALL_CITIES = [
  ...CITIES.tier1,
  ...CITIES.newTier1,
  ...CITIES.tourist,
  ...CITIES.capital,
];

/** 热门城市（优先展示，用于首页/搜索卡/列表页快捷选择） */
export const POPULAR_CITIES = [
  ...CITIES.tier1,
  ...CITIES.newTier1.slice(0, 8), // 杭州、成都、重庆、西安、苏州、南京、武汉、长沙
  '三亚',
  '厦门',
];

/** 按区域分组（用于城市选择器分组展示） */
export const CITIES_BY_REGION = {
  tier1: CITIES.tier1,
  newTier1: CITIES.newTier1,
  tourist: CITIES.tourist,
  capital: CITIES.capital,
};
