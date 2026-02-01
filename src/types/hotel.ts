export interface HotelImage {
  id?: number;
  imageUrl: string;
  description?: string;
}

export interface RoomType {
  id?: number;
  name?: string;
  price?: number;
  originalPrice?: number;
  bedType?: string;
  roomSize?: string;
  maxGuests?: number;
  floors?: string;
  imageUrl?: string;
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
}

export interface HotelListResponse {
  data: Hotel[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
