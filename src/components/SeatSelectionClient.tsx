'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SeatMap } from '@/components/SeatMap';
import { useFlightStore } from '@/store/flightStore';
import type { Flight, Seat } from '@/types';
import { ArrowRight, Info } from 'lucide-react';

interface Props {
  flight:       Flight;
  initialSeats: Seat[];
}

export function SeatSelectionClient({ flight, initialSeats }: Props) {
  const router        = useRouter();
  const selectedSeat  = useFlightStore((s) => s.selectedSeat);
  const setStep       = useFlightStore((s) => s.setCurrentStep);
  const setFlight     = useFlightStore((s) => s.setSelectedFlight);

  // Ensure flight is in store (handles direct URL navigation / page refresh)
  useEffect(() => {
    if (!useFlightStore.getState().selectedFlight) {
      setFlight(flight);
    }
  }, [flight, setFlight]);

  const handleConfirm = () => {
    setStep('passengers');
    router.push(`/booking/${flight.id}/passengers`);
  };

  const totalPrice = selectedSeat
    ? flight.base_price + selectedSeat.extra_fee
    : null;

  return (
    <div className="space-y-6">
      <SeatMap
        flightId={flight.id}
        initialSeats={initialSeats}
        onSeatConfirmed={() => {}}
      />

      {/* Summary bar */}
      <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {selectedSeat ? (
          <>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Seat <span className="text-blue-600">{selectedSeat.seat_number}</span>
                {' · '}
                <span className="capitalize">{selectedSeat.class}</span>
              </p>
              {selectedSeat.extra_fee > 0 && (
                <p className="text-xs text-slate-400 mt-0.5">
                  +₹{selectedSeat.extra_fee.toLocaleString()} seat fee
                </p>
              )}
              <p className="text-lg font-bold text-blue-600 mt-1">
                ₹{totalPrice?.toLocaleString()}
              </p>
            </div>
            <button onClick={handleConfirm} className="btn-primary">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Info className="h-4 w-4 shrink-0" />
            Click on an available seat to select it
          </div>
        )}
      </div>
    </div>
  );
}
