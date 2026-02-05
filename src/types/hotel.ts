export interface HotelImage {
  id?: number;
  imageUrl?: string; // 可能为 null
  description?: string;
}

export interface RoomType {
  id?: number;
  name?: string;
  price?: number;
  originalPrice?: number;
  discountType?: 'none' | 'percentage' | 'fixed' | 'package';
  discountValue?: number;
  discountDescription?: string;
  bedType?: string;
  roomSize?: number; // 后端定义为 int
  maxGuests?: number;
  floors?: string;
  imageUrl?: string;
  amenities?: string[];
}

export interface Hotel {
  id: number;
  nameCn: string;
  nameEn?: string;
  address: string;
  starRating: number;
  openingDate?: string;
  description?: string;
  facilities?: string[];
  nearbyAttractions?: string[];
  transportation?: string[];
  status?: string;
  roomTypes?: RoomType[];
  images?: HotelImage[];
  /** 后端列表/详情返回的显式主图 URL，优先使用避免 relation 序列化丢失 */
  coverImageUrl?: string;
}

export interface HotelListResponse {
  data: Hotel[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
