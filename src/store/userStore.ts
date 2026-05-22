import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { Booking } from '@/types';

interface UserState {
  session:           Session | null;
  cachedBookings:    Booking[];
  setSession:        (s: Session | null) => void;
  setCachedBookings: (bookings: Booking[]) => void;
  resetUser:         () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      session:        null,
      cachedBookings: [],

      setSession:        (s) => set({ session: s }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      resetUser:         () => set({ session: null, cachedBookings: [] }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // partialize:
      //   session       → persist access_token + refresh_token only (not full Session object)
      //   cachedBookings → persist so My Bookings is readable offline (PWA requirement)
      partialize: (state) => ({
        session: state.session
          ? {
              access_token:  state.session.access_token,
              refresh_token: state.session.refresh_token,
              expires_at:    state.session.expires_at,
            }
          : null,
        cachedBookings: state.cachedBookings,
      }),
    }
  )
);
