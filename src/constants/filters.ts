/**
 * 酒店筛选配置常量
 * 参考携程旅行App的筛选功能设计
 */

// ============ 排序选项 ============
export const SORT_OPTIONS = [
  { key: 'smart', label: '智能排序' },
  { key: 'distance', label: '位置距离' },
  { key: 'price', label: '价格/星级' },
  { key: 'filter', label: '筛选' },
];

// ============ 位置距离筛选 ============
export const DISTANCE_OPTIONS = [
  { key: '500', label: '500米内', value: 0.5 },
  { key: '1000', label: '1公里内', value: 1 },
  { key: '2000', label: '2公里内', value: 2 },
  { key: '3000', label: '3公里内', value: 3 },
  { key: '5000', label: '5公里内', value: 5 },
];

// 位置分类（左侧菜单）
export const LOCATION_CATEGORIES = [
  { key: 'distance', label: '直线距离' },
  { key: 'hot', label: '热门' },
  { key: 'scenic', label: '景点' },
  { key: 'metro', label: '地铁线' },
  { key: 'airport', label: '机场车站' },
  { key: 'district', label: '行政区' },
  { key: 'business', label: '商业区' },
  { key: 'university', label: '大学' },
  { key: 'hospital', label: '医院' },
];

// 热门地点（按城市配置）
export const HOT_LOCATIONS: Record<string, { name: string; percent: number }[]> = {
  '上海': [
    { name: '外滩', percent: 34.2 },
    { name: '南京路步行街', percent: 21.6 },
    { name: '人民广场', percent: 8.1 },
    { name: '迪士尼度假区', percent: 6.3 },
    { name: '静安区', percent: 5.8 },
    { name: '浦东新区', percent: 3.4 },
    { name: '徐汇区', percent: 2.3 },
    { name: '陆家嘴', percent: 2.1 },
    { name: '黄浦区', percent: 1.7 },
    { name: '静安寺', percent: 1.5 },
    { name: '豫园', percent: 1.3 },
  ],
  '北京': [
    { name: '天安门', percent: 28.5 },
    { name: '王府井', percent: 18.2 },
    { name: '三里屯', percent: 12.3 },
    { name: '国贸', percent: 8.7 },
    { name: '故宫', percent: 7.2 },
    { name: '朝阳区', percent: 5.1 },
    { name: '海淀区', percent: 4.3 },
  ],
  '广州': [
    { name: '天河区', percent: 25.3 },
    { name: '珠江新城', percent: 18.7 },
    { name: '北京路', percent: 12.1 },
    { name: '白云区', percent: 8.5 },
    { name: '番禺区', percent: 6.2 },
  ],
  '深圳': [
    { name: '福田区', percent: 22.4 },
    { name: '南山区', percent: 19.8 },
    { name: '罗湖区', percent: 15.3 },
    { name: '华强北', percent: 10.2 },
    { name: '东门', percent: 8.1 },
  ],
  '杭州': [
    { name: '西湖', percent: 32.5 },
    { name: '武林广场', percent: 15.2 },
    { name: '钱江新城', percent: 12.3 },
    { name: '西溪湿地', percent: 8.7 },
    { name: '灵隐寺', percent: 6.5 },
  ],
};

// 默认热门地点（当城市没有配置时使用）
export const DEFAULT_HOT_LOCATIONS = [
  { name: '市中心', percent: 25.0 },
  { name: '火车站', percent: 18.0 },
  { name: '商业区', percent: 15.0 },
  { name: '景点区', percent: 12.0 },
];

// ============ 价格筛选 ============
export const PRICE_RANGES = [
  { key: 'under200', label: '¥200以下', min: 0, max: 200 },
  { key: '200-350', label: '¥200-¥350', min: 200, max: 350 },
  { key: '350-450', label: '¥350-¥450', min: 350, max: 450 },
  { key: '450-550', label: '¥450-¥550', min: 450, max: 550 },
  { key: '550-900', label: '¥550-¥900', min: 550, max: 900 },
  { key: '900-1400', label: '¥900-¥1400', min: 900, max: 1400 },
  { key: '1400-1900', label: '¥1400-¥1900', min: 1400, max: 1900 },
  { key: 'over1900', label: '¥1900以上', min: 1900, max: undefined },
];

// ============ 星级/钻级筛选 ============
export const STAR_RATINGS = [
  { key: '2', label: '2钻/星及以下', subLabel: '经济', value: 2 },
  { key: '3', label: '3钻/星', subLabel: '舒适', value: 3 },
  { key: '4', label: '4钻/星', subLabel: '高档', value: 4 },
  { key: '5', label: '5钻/星', subLabel: '豪华', value: 5 },
  { key: 'gold', label: '金钻酒店', subLabel: '奢华体验', value: 6 },
  { key: 'platinum', label: '铂钻酒店', subLabel: '超奢品质', value: 7 },
];

// ============ 综合筛选 ============
// 热门筛选标签
export const HOT_FILTER_TAGS = [
  '上榜酒店', '酒店', '全季', '亚朵', '4.7分以上', '双床房',
  '免费停车场', '家庭房', '低碳酒店',
];

// 住宿类型
export const ACCOMMODATION_TYPES = [
  { key: 'hotel', label: '酒店' },
  { key: 'homestay', label: '民宿' },
  { key: 'apartment', label: '酒店公寓' },
  { key: 'hostel', label: '青年旅馆' },
  { key: 'flat', label: '公寓' },
  { key: 'hourly', label: '钟点房' },
];

// 酒店特色 - key 使用中文以便后端搜索匹配
export const HOTEL_FEATURES = [
  { key: '电竞', label: '电竞酒店' },
  { key: '亲子', label: '亲子酒店' },
  { key: '地铁', label: '近地铁' },
  { key: '江景', label: '迷人江景' },
  { key: '景观', label: '窗外好景' },
  { key: '夜景', label: '动人夜景' },
];

// 客房特色 - key 使用中文以便后端搜索匹配
export const ROOM_FEATURES = [
  { key: '家庭房', label: '家庭房' },
  { key: '套房', label: '套房' },
  { key: '亲子', label: '亲子主题房' },
  { key: '双床', label: '双床房' },
  { key: '大床', label: '大床房' },
];

// 设施服务 - key 使用中文以便后端搜索匹配
export const FACILITIES = [
  { key: '免费停车', label: '免费停车' },
  { key: '免费WiFi', label: '免费WiFi' },
  { key: '含早餐', label: '含早餐' },
  { key: '游泳池', label: '游泳池' },
  { key: '健身房', label: '健身房' },
  { key: 'SPA', label: 'SPA' },
  { key: '洗衣', label: '洗衣房' },
  { key: '餐厅', label: '餐厅' },
  { key: '24小时前台', label: '24小时前台' },
];

// 品牌（热门酒店品牌）
export const HOTEL_BRANDS = [
  '全季', '亚朵', '如家', '汉庭', '锦江之星', '7天', '维也纳',
  '希尔顿', '万豪', '洲际', '喜来登', '凯悦', '香格里拉', '四季',
];

// ============ 筛选分类配置 ============
export const FILTER_CATEGORIES = [
  { key: 'history', label: '历史筛选' },
  { key: 'hot', label: '热门筛选' },
  { key: 'type', label: '住宿类型' },
  { key: 'theme', label: '主题特色' },
  { key: 'brand', label: '品牌' },
  { key: 'facility', label: '设施' },
  { key: 'room', label: '床型餐食' },
  { key: 'area', label: '房间面积' },
  { key: 'rating', label: '点评' },
  { key: 'promotion', label: '权益/促销' },
  { key: 'policy', label: '政策服务' },
];

// ============ 筛选状态类型 ============
export interface FilterState {
  // 排序
  sortBy: string;
  // 位置距离
  locationCategory: string;
  selectedLocation: string;
  maxDistance: number | null;
  // 价格
  minPrice: number | null;
  maxPrice: number | null;
  priceRange: string | null;
  // 星级
  starRating: number | null;
  // 综合筛选
  accommodationType: string[];
  hotelFeatures: string[];
  roomFeatures: string[];
  facilities: string[];
  brands: string[];
  hotTags: string[];
  // 关键词
  keyword: string;
}

// 默认筛选状态
export const DEFAULT_FILTER_STATE: FilterState = {
  sortBy: 'smart',
  locationCategory: 'hot',
  selectedLocation: '',
  maxDistance: null,
  minPrice: null,
  maxPrice: null,
  priceRange: null,
  starRating: null,
  accommodationType: [],
  hotelFeatures: [],
  roomFeatures: [],
  facilities: [],
  brands: [],
  hotTags: [],
  keyword: '',
};
