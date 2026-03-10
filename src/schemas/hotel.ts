/**
 * Zod schemas for hotel API response validation (dev-only detailed path).
 * Production uses lightweight manual checks; see minimalValidateList/minimalValidateHotel in api.ts.
 */
import { z } from 'zod';

const nullishNumber = z.number().finite().nullish();
const nullishString = z.string().nullish();

export const RoomTypeSchema = z.object({
  id: nullishNumber,
  name: nullishString,
  price: nullishNumber,
  originalPrice: nullishNumber,
  discountType: z.enum(['none', 'percentage', 'fixed', 'package']).nullish(),
  discountValue: nullishNumber,
  discountDescription: nullishString,
  bedType: nullishString,
  roomSize: nullishNumber,
  maxGuests: nullishNumber,
  floors: nullishString,
  imageUrl: nullishString,
  amenities: z.array(z.string()).nullish(),
}).passthrough();

export const HotelImageSchema = z.object({
  id: nullishNumber,
  imageUrl: nullishString,
  description: nullishString,
}).passthrough();

export const HotelSchema = z.object({
  id: z.number().finite(),
  nameCn: z.string(),
  address: z.string(),
  starRating: z.number().finite(),
  nameEn: nullishString,
  openingDate: nullishString,
  description: nullishString,
  facilities: z.array(z.string()).nullish(),
  nearbyAttractions: z.array(z.string()).nullish(),
  transportation: z.array(z.string()).nullish(),
  status: nullishString,
  coverImageUrl: nullishString,
  roomTypes: z.array(RoomTypeSchema).nullish(),
  images: z.array(HotelImageSchema).nullish(),
}).passthrough();

export const HotelListResponseSchema = z.object({
  data: z.array(HotelSchema),
  page: z.number().finite(),
  pageSize: z.number().finite(),
  total: z.number().finite(),
  totalPages: z.number().finite(),
}).passthrough();
