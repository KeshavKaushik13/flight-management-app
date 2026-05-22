'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import type { Flight, ReserveSeatResult } from '@/types';
import { User, CreditCard, Globe, Calendar, Loader2, AlertTriangle } from 'lucide-react';

interface Props { flight: Flight; userId: string }

function generatePNR(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function PassengerForm({ flight, userId }: Props) {
  const router        = useRouter();
  const selectedSeat  = useFlightStore((s) => s.selectedSeat);
  const passengerForm = useFlightStore((s) => s.passengerForm);
  const setForm       = useFlightStore((s) => s.setPassengerForm);
  const setStep       = useFlightStore((s) => s.setCurrentStep);
  const resetBooking    = useFlightStore((s) => s.resetBooking);
  const setOptimistic   = useFlightStore((s) => s.setOptimisticSeat);
  const setSelectedSeat = useFlightStore((s) => s.setSelectedSeat);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  // passport_no only in local state — never persisted to localStorage
  const [passportNo, setPassportNo] = useState('');

  // Use a ref to prevent the useEffect race condition —
  // we set this to true just before calling resetBooking()
  // so the "no seat" guard doesn't fire during the success path
  const bookingCompleted = useRef(false);

  // No seat selected — show a message with back button instead of
  // silently redirecting (which caused the race condition)
  if (!selectedSeat && !bookingCompleted.current) {
    return (
      <div className="card text-center py-10">
        <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-700 font-semibold mb-1">No seat selected</p>
        <p className="text-slate-400 text-sm mb-5">Please go back and choose a seat first.</p>
        <button onClick={() => router.back()} className="btn-secondary">
          ← Back to Seat Map
        </button>
      </div>
    );
  }

  if (!selectedSeat) return null;

  const totalPrice = flight.base_price + selectedSeat.extra_fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerForm.full_name || !passportNo || !passengerForm.nationality || !passengerForm.dob) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    setError('');

    const pnr = generatePNR();
    const sb  = createClient();

    const { data, error: rpcError } = await sb.rpc('reserve_seat', {
      p_flight_id:   flight.id,
      p_seat_id:     selectedSeat.id,
      p_user_id:     userId,
      p_total_price: totalPrice,
      p_pnr_code:    pnr,
      p_full_name:   passengerForm.full_name,
      p_passport_no: passportNo,
      p_nationality: passengerForm.nationality,
      p_dob:         passengerForm.dob,
    });

    const result = data as ReserveSeatResult | null;

    if (rpcError || !result?.success) {
      setOptimistic(null);
      setSelectedSeat(null);
      setError(result?.error ?? rpcError?.message ?? 'Booking failed. The seat may have just been taken.');
      setLoading(false);
      return;
    }

    // Mark completed BEFORE resetBooking so the no-seat guard above
    // doesn't render while we navigate away
    bookingCompleted.current = true;
    setStep('confirmation');
    resetBooking();
    router.push(`/confirmation/${pnr}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Full name */}
      <div>
        <label className="label">Full Name (as on passport)</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="John Doe"
            value={passengerForm.full_name}
            onChange={(e) => setForm({ full_name: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Passport number — NOT persisted */}
      <div>
        <label className="label">Passport Number</label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="A1234567"
            value={passportNo}
            onChange={(e) => setPassportNo(e.target.value)}
            autoComplete="off"
            required
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">🔒 Passport number is not saved locally</p>
      </div>

      {/* Nationality */}
      <div>
        <label className="label">Nationality</label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            className="input pl-9"
            placeholder="Indian"
            value={passengerForm.nationality}
            onChange={(e) => setForm({ nationality: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Date of birth */}
      <div>
        <label className="label">Date of Birth</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="date"
            className="input pl-9"
            max={new Date().toISOString().split('T')[0]}
            value={passengerForm.dob}
            onChange={(e) => setForm({ dob: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Price summary */}
      <div className="card bg-blue-50 border-blue-100">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Base fare</span>
          <span className="font-semibold">₹{flight.base_price.toLocaleString()}</span>
        </div>
        {selectedSeat.extra_fee > 0 && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-600">Seat fee ({selectedSeat.class})</span>
            <span className="font-semibold">₹{selectedSeat.extra_fee.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t border-blue-200 mt-3 pt-3 flex justify-between font-bold text-blue-700">
          <span>Total</span>
          <span>₹{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Confirming booking…</>
        ) : (
          'Confirm & Book'
        )}
      </button>
    </form>
  );
}
