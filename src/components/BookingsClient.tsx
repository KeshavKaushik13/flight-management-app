'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import { useUserStore } from '@/store/userStore';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Booking, Flight, Seat, CancelBookingResult, RescheduleResult } from '@/types';
import {
  Plane, ChevronDown, ChevronUp, RotateCcw, XCircle, Calendar, MapPin, Loader2, BookOpen
} from 'lucide-react';

interface Props { initialBookings: Booking[]; userId: string }

export function BookingsClient({ initialBookings, userId }: Props) {
  const [bookings, setBookings]             = useState<Booking[]>(initialBookings);
  const [expandedId, setExpandedId]         = useState<string | null>(null);
  const [cancelTarget, setCancelTarget]     = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [altFlights, setAltFlights]         = useState<Flight[]>([]);
  const [altSeats, setAltSeats]             = useState<Seat[]>([]);
  const [selectedAltFlight, setSelectedAltFlight] = useState<string>('');
  const [selectedAltSeat,   setSelectedAltSeat]   = useState<string>('');
  const [loading, setLoading]               = useState(false);
  const [error,   setError]                 = useState('');

  const setCachedBookings = useUserStore((s) => s.setCachedBookings);
  const resetBooking      = useFlightStore((s) => s.resetBooking);

  // Cache on mount so My Bookings is readable offline via Zustand persist
  useEffect(() => {
    setCachedBookings(initialBookings);
  }, [initialBookings, setCachedBookings]);

  const refresh = (updated: Booking[]) => {
    setBookings(updated);
    setCachedBookings(updated);
  };

  // ── Cancel ────────────────────────────────────────────────
  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    setLoading(true);
    setError('');

    const sb = createClient();
    const { data, error: rpcError } = await sb.rpc('cancel_booking', {
      p_booking_id: cancelTarget.id,
      p_user_id:    userId,
    });

    const result = data as CancelBookingResult | null;

    if (rpcError || !result?.success) {
      setError(result?.error ?? rpcError?.message ?? 'Cancellation failed.');
      setLoading(false);
      setCancelTarget(null);
      return;
    }

    refresh(
      bookings.map((b) =>
        b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b
      )
    );
    resetBooking();
    setCancelTarget(null);
    setLoading(false);
  };

  // ── Reschedule – load alternatives ───────────────────────
  const openReschedule = async (booking: Booking) => {
    setError('');
    setRescheduleTarget(booking);
    const sb = createClient();

    const { data: flights } = await sb
      .from('flights')
      .select('*')
      .eq('origin',      booking.flights!.origin)
      .eq('destination', booking.flights!.destination)
      .neq('id', booking.flight_id)
      .neq('status', 'cancelled')
      .gt('departs_at', new Date().toISOString())
      .order('departs_at');

    setAltFlights((flights as Flight[]) ?? []);
    setSelectedAltFlight('');
    setSelectedAltSeat('');
    setAltSeats([]);
  };

  const loadAltSeats = async (flightId: string) => {
    setSelectedAltFlight(flightId);
    setSelectedAltSeat('');
    const sb = createClient();
    const { data } = await sb
      .from('seats')
      .select('*')
      .eq('flight_id', flightId)
      .eq('is_available', true)
      .order('seat_number');
    setAltSeats((data as Seat[]) ?? []);
  };

  const handleRescheduleConfirm = async () => {
    if (!rescheduleTarget || !selectedAltFlight || !selectedAltSeat) return;
    setLoading(true);
    setError('');

    const sb = createClient();
    const { data, error: rpcError } = await sb.rpc('reschedule_booking', {
      p_booking_id:    rescheduleTarget.id,
      p_user_id:       userId,
      p_new_flight_id: selectedAltFlight,
      p_new_seat_id:   selectedAltSeat,
    });

    const result = data as RescheduleResult | null;

    if (rpcError || !result?.success) {
      setError(result?.error ?? rpcError?.message ?? 'Reschedule failed.');
      setLoading(false);
      setRescheduleTarget(null);
      return;
    }

    // Refresh bookings from DB
    const { data: fresh } = await sb
      .from('bookings')
      .select(`*, flights(*), seats(*), passengers(*)`)
      .eq('user_id', userId)
      .order('booked_at', { ascending: false });

    refresh((fresh as Booking[]) ?? []);
    setRescheduleTarget(null);
    setLoading(false);
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No bookings yet.</p>
        <p className="text-slate-400 text-sm mt-1">Your confirmed bookings will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700 text-sm">{error}</div>
      )}

      {bookings.map((b) => {
        const flight    = b.flights!;
        const seat      = b.seats!;
        const passenger = b.passengers?.[0];
        const isExpanded = expandedId === b.id;
        const isCancelled = b.status === 'cancelled';
        const departsSoon = new Date(flight.departs_at).getTime() - Date.now() < 2 * 60 * 60 * 1000;

        return (
          <div key={b.id} className="card">
            {/* Header row */}
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : b.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="rounded-xl bg-blue-50 p-2.5 shrink-0">
                  <Plane className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">
                    {flight.origin.split(' (')[0]} → {flight.destination.split(' (')[0]}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {flight.flight_no} · PNR: <span className="font-mono font-semibold text-blue-600">{b.pnr_code}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <StatusBadge status={b.status} />
                {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
              </div>
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div className="mt-5 space-y-4 border-t border-slate-100 pt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="label">Departs</p>
                    <p className="font-semibold">{format(new Date(flight.departs_at), 'HH:mm')}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(flight.departs_at), 'dd MMM')}
                    </p>
                  </div>
                  <div>
                    <p className="label">Arrives</p>
                    <p className="font-semibold">{format(new Date(flight.arrives_at), 'HH:mm')}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {flight.destination.split(' (')[0]}
                    </p>
                  </div>
                  <div>
                    <p className="label">Seat</p>
                    <p className="font-semibold capitalize">{seat.seat_number} · {seat.class}</p>
                  </div>
                  <div>
                    <p className="label">Total</p>
                    <p className="font-semibold text-blue-600">₹{b.total_price.toLocaleString()}</p>
                  </div>
                </div>

                {passenger && (
                  <div className="text-sm">
                    <p className="label">Passenger</p>
                    <p className="font-semibold">{passenger.full_name}</p>
                    <p className="text-slate-400">{passenger.nationality}</p>
                  </div>
                )}

                {/* Actions */}
                {!isCancelled && (
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => openReschedule(b)}
                      disabled={departsSoon}
                      className="btn-secondary text-xs"
                      title={departsSoon ? 'Cannot reschedule within 2h of departure' : 'Reschedule flight'}
                    >
                      <RotateCcw className="h-3.5 w-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={() => setCancelTarget(b)}
                      disabled={departsSoon}
                      className="btn-danger text-xs"
                      title={departsSoon ? 'Cannot cancel within 2h of departure' : 'Cancel booking'}
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </button>
                    {departsSoon && (
                      <p className="text-xs text-amber-600 self-center">
                        ⚠ Actions locked within 2h of departure
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel dialog */}
      {cancelTarget && (
        <ConfirmDialog
          title="Cancel Booking"
          message={`Are you sure you want to cancel booking ${cancelTarget.pnr_code}? This action cannot be undone.`}
          confirmLabel={loading ? 'Cancelling…' : 'Yes, Cancel'}
          danger
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
        />
      )}

      {/* Reschedule dialog */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-600" /> Reschedule Flight
            </h2>

            <div className="space-y-4">
              <div>
                <label className="label">Select New Flight</label>
                <select
                  className="input"
                  value={selectedAltFlight}
                  onChange={(e) => loadAltSeats(e.target.value)}
                >
                  <option value="">-- Choose a flight --</option>
                  {altFlights.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.flight_no} · {format(new Date(f.departs_at), 'dd MMM HH:mm')} · ₹{f.base_price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              {altSeats.length > 0 && (
                <div>
                  <label className="label">Select New Seat</label>
                  <select
                    className="input"
                    value={selectedAltSeat}
                    onChange={(e) => setSelectedAltSeat(e.target.value)}
                  >
                    <option value="">-- Choose a seat --</option>
                    {altSeats.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.seat_number} · {s.class} · +₹{s.extra_fee.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setRescheduleTarget(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleRescheduleConfirm}
                disabled={loading || !selectedAltFlight || !selectedAltSeat}
                className="btn-primary"
              >
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : 'Confirm Reschedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
