export interface CheckoutData {
  listing: {
    id: string;
    name: string;
    image: string;
    city: string;
    rating: number;
    reviewCount: number;
  };
  dates: {
    checkIn: Date;
    checkOut: Date;
    nights: number;
  };
  guests: {
    adults: number;
    children: number;
  };
  pricing: {
    basePrice: number;
    baseNights: number;
    weekendPrice: number;
    weekendNights: number;
    subtotal: number;
    serviceFee: number;
    tax: number;
    total: number;
  };
  traveler?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    arrivalTime?: string;
    specialRequests?: string;
  };
  payment?: {
    method: 'card' | 'transfer' | 'wallet';
    cardNumber?: string;
    cardExpiry?: string;
    cardCvv?: string;
    cardName?: string;
  };
}

export interface CheckoutFlowProps {
  listingId: string;
  dateRange: {
    checkIn: Date;
    checkOut: Date;
  };
  guests: {
    adults: number;
    children: number;
  };
  pricing: {
    basePrice: number;
    baseNights: number;
    weekendPrice: number;
    weekendNights: number;
    subtotal: number;
    serviceFee: number;
    tax: number;
    total: number;
  };
  onComplete: (reservationId: string) => void;
  onCancel?: () => void;
}

export type CheckoutStep = 1 | 2;
