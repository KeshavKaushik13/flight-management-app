// ============================================================
// src/types/index.ts — all shared types, no `any`
// ============================================================

export type FlightStatus = 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
export type SeatClass    = 'economy' | 'business' | 'first';
export type BookingStatus = 'confirmed' | 'rescheduled' | 'cancelled';

export interface Flight {
  id:            string;
  flight_no:     string;
  origin:        string;
  destination:   string;
  departs_at:    string;
  arrives_at:    string;
  aircraft_type: string;
  status:        FlightStatus;
  base_price:    number;
}

export interface Seat {
  id:           string;
  flight_id:    string;
  seat_number:  string;
  class:        SeatClass;
  is_available: boolean;
  extra_fee:    number;
}

export interface Booking {
  id:          string;
  user_id:     string;
  flight_id:   string;
  seat_id:     string;
  status:      BookingStatus;
  booked_at:   string;
  total_price: number;
  pnr_code:    string;
  // joined
  flights?:    Flight;
  seats?:      Seat;
  passengers?: Passenger[];
}

export interface Passenger {
  id:          string;
  booking_id:  string;
  full_name:   string;
  passport_no: string;
  nationality: string;
  dob:         string;
}

export interface Reschedule {
  id:             string;
  booking_id:     string;
  old_flight_id:  string;
  new_flight_id:  string;
  requested_at:   string;
  fee_charged:    number;
}

export interface SearchQuery {
  origin:      string;
  destination: string;
  date:        string;
  passengers:  number;
}

// passport_no intentionally excluded — lives only in local React state,
// never stored in Zustand or persisted to localStorage
export interface PassengerFormData {
  full_name:   string;
  nationality: string;
  dob:         string;
}

// RPC response shapes
export interface ReserveSeatResult {
  success:    boolean;
  error?:     string;
  booking_id?: string;
}

export interface CancelBookingResult {
  success: boolean;
  error?:  string;
}

export interface RescheduleResult {
  success:      boolean;
  error?:       string;
  fee_charged?: number;
}
