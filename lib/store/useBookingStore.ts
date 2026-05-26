import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookingState, WishlistState, SearchHistory, SearchFilters } from '../types';

interface BookingStore extends BookingState {
  setListing: (listingId: string) => void;
  setDates: (checkIn: string, checkOut: string) => void;
  setGuests: (adults: number, children: number, infants: number) => void;
  resetBooking: () => void;
}

interface WishlistStore extends WishlistState {
  toggleWishlist: (listingId: string) => void;
  isInWishlist: (listingId: string) => boolean;
  clearWishlist: () => void;
}

interface SearchStore {
  history: SearchHistory[];
  currentFilters: SearchFilters | null;
  setFilters: (filters: SearchFilters) => void;
  addToHistory: (prompt: string, filters: SearchFilters) => void;
  clearHistory: () => void;
}

// ─── Booking Store ───
export const useBookingStore = create<BookingStore>()(
  persist(
    (set) => ({
      listingId: null,
      checkIn: null,
      checkOut: null,
      guests: 2,
      adults: 2,
      children: 0,
      infants: 0,

      setListing: (listingId: string) => set({ listingId }),

      setDates: (checkIn: string, checkOut: string) => set({ checkIn, checkOut }),

      setGuests: (adults: number, children: number, infants: number) =>
        set({
          adults,
          children,
          infants,
          guests: adults + children,
        }),

      resetBooking: () =>
        set({
          listingId: null,
          checkIn: null,
          checkOut: null,
          guests: 2,
          adults: 2,
          children: 0,
          infants: 0,
        }),
    }),
    {
      name: 'sojori-booking-storage',
    }
  )
);

// ─── Wishlist Store ───
export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (listingId: string) =>
        set((state) => ({
          items: state.items.includes(listingId)
            ? state.items.filter((id) => id !== listingId)
            : [...state.items, listingId],
        })),

      isInWishlist: (listingId: string) => get().items.includes(listingId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'sojori-wishlist-storage',
    }
  )
);

// ─── Search Store ───
export const useSearchStore = create<SearchStore>()(
  persist(
    (set) => ({
      history: [],
      currentFilters: null,

      setFilters: (filters: SearchFilters) => set({ currentFilters: filters }),

      addToHistory: (prompt: string, filters: SearchFilters) =>
        set((state) => ({
          history: [
            {
              prompt,
              filters,
              timestamp: Date.now(),
            },
            ...state.history.slice(0, 9), // Keep last 10
          ],
        })),

      clearHistory: () => set({ history: [] }),
    }),
    {
      name: 'sojori-search-storage',
    }
  )
);
