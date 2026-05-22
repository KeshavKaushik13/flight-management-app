import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Flight, Seat, SearchQuery, PassengerFormData } from '@/types';

export type BookingStep = 'search' | 'results' | 'seats' | 'passengers' | 'confirmation';

interface FlightState {
  // Search
  searchQuery:    SearchQuery;
  // Selected flight / seat
  selectedFlight: Flight | null;
  selectedSeat:   Seat   | null;
  // Optimistic seat id (before Supabase confirms)
  optimisticSeatId: string | null;
  // Booking flow step
  currentStep:    BookingStep;
  // Passenger form — passport_no is NOT a field here; it lives only in PassengerForm local state
  passengerForm:  PassengerFormData;
  // Actions
  setSearchQuery:    (q: SearchQuery) => void;
  setSelectedFlight: (f: Flight | null) => void;
  setSelectedSeat:   (s: Seat | null) => void;
  setOptimisticSeat: (id: string | null) => void;
  setCurrentStep:    (step: BookingStep) => void;
  setPassengerForm:  (data: Partial<PassengerFormData>) => void;
  resetBooking:      () => void;
  resetAll:          () => void;
}

const defaultSearch: SearchQuery = {
  origin:      '',
  destination: '',
  date:        '',
  passengers:  1,
};

const defaultPassenger: PassengerFormData = {
  full_name:   '',
  nationality: '',
  dob:         '',
  // passport_no is NOT in this store — it lives only in PassengerForm local state
};

export const useFlightStore = create<FlightState>()(
  persist(
    (set) => ({
      searchQuery:      defaultSearch,
      selectedFlight:   null,
      selectedSeat:     null,
      optimisticSeatId: null,
      currentStep:      'search',
      passengerForm:    defaultPassenger,

      setSearchQuery:    (q) => set({ searchQuery: q }),
      setSelectedFlight: (f) => set({ selectedFlight: f }),
      setSelectedSeat:   (s) => set({ selectedSeat: s }),
      setOptimisticSeat: (id) => set({ optimisticSeatId: id }),
      setCurrentStep:    (step) => set({ currentStep: step }),
      setPassengerForm:  (data) =>
        set((state) => ({ passengerForm: { ...state.passengerForm, ...data } })),

      resetBooking: () =>
        set({
          selectedFlight:   null,
          selectedSeat:     null,
          optimisticSeatId: null,
          currentStep:      'search',
          passengerForm:    defaultPassenger,
        }),

      resetAll: () =>
        set({
          searchQuery:      defaultSearch,
          selectedFlight:   null,
          selectedSeat:     null,
          optimisticSeatId: null,
          currentStep:      'search',
          passengerForm:    defaultPassenger,
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // partialize: persist only non-sensitive fields.
      // passport_no is not in PassengerFormData at all — it lives only in
      // PassengerForm local React state and is never touched by this store.
      partialize: (state) => ({
        searchQuery:    state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat:   state.selectedSeat,
        currentStep:    state.currentStep,
        passengerForm:  state.passengerForm,
      }),
    }
  )
);
