export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled' | 'expired';

export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  hotelId: number;
  roomTypeId: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  rooms: number;
  guests: number;
  amountCents: number;
  status: OrderStatus;
  paidAt: number | null;
  cancelledAt: number | null;
  expiredAt: number | null;
  expiresAt: number;
  paymentEventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

