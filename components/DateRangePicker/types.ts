export interface DateRange {
  checkIn: Date | null;
  checkOut: Date | null;
}

export interface DateAvailability {
  date: Date;
  available: boolean;
  price: number;
  isWeekend?: boolean;
}

export interface PriceBreakdown {
  baseNights: number;
  basePrice: number;
  weekendNights: number;
  weekendPrice: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  total: number;
}

export interface DateRangePickerProps {
  listingId: string;
  minNights?: number;
  maxNights?: number;
  onDateSelect: (range: DateRange) => void;
  onPriceCalculate?: (breakdown: PriceBreakdown) => void;
}
