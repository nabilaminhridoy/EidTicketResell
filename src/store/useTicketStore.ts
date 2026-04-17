import { create } from 'zustand';

interface FilterState {
  priceRange: [number, number];
  transportType: string | null;
  departureCity: string | null;
  destinationCity: string | null;
  date: string | null;
  timeSlot: string | null; // Morning, Afternoon, Evening, Night
  classType: string | null;
  sortBy: string; // Newest, PriceLowHigh, etc.

  // Actions
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'resetFilters'>, value: any) => void;
  resetFilters: () => void;
}

export const useTicketStore = create<FilterState>((set) => ({
  priceRange: [0, 5000],
  transportType: null,
  departureCity: null,
  destinationCity: null,
  date: null,
  timeSlot: null,
  classType: null,
  sortBy: 'Newest First',

  setFilter: (key, value) => set((state) => ({ ...state, [key]: value })),
  resetFilters: () => set({
    priceRange: [0, 5000],
    transportType: null,
    departureCity: null,
    destinationCity: null,
    date: null,
    timeSlot: null,
    classType: null,
    sortBy: 'Newest First',
  }),
}));
