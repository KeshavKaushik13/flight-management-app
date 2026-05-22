'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFlightStore } from '@/store/flightStore';
import type { Seat, SeatClass } from '@/types';

interface Props {
  flightId:        string;
  initialSeats:    Seat[];
  onSeatConfirmed: (seat: Seat) => void;
}

const CLASS_COLORS: Record<SeatClass, string> = {
  first:    'bg-amber-400 text-white border-amber-500',
  business: 'bg-purple-400 text-white border-purple-500',
  economy:  'bg-blue-400  text-white border-blue-500',
};

const COLS = ['A', 'B', 'C', '', 'D', 'E', 'F'] as const;
const ROWS = Array.from({ length: 30 }, (_, i) => i + 1);

export function SeatMap({ flightId, initialSeats, onSeatConfirmed }: Props) {
  const [seats, setSeats] = useState<Map<string, Seat>>(() => {
    const m = new Map<string, Seat>();
    initialSeats.forEach((s) => m.set(s.seat_number, s));
    return m;
  });
  const [tooltip, setTooltip]  = useState<{ seat: Seat; x: number; y: number } | null>(null);

  const optimisticSeatId = useFlightStore((s) => s.optimisticSeatId);
  const selectedSeat     = useFlightStore((s) => s.selectedSeat);
  const setOptimistic    = useFlightStore((s) => s.setOptimisticSeat);
  const setSelectedSeat  = useFlightStore((s) => s.setSelectedSeat);

  // Supabase Realtime subscription
  useEffect(() => {
    const sb = createClient();
    const channel = sb
      .channel(`seats-${flightId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `flight_id=eq.${flightId}`,
        },
        (payload) => {
          const updated = payload.new as Seat;
          setSeats((prev) => {
            const next = new Map(prev);
            next.set(updated.seat_number, updated);
            return next;
          });
        }
      )
      .subscribe();
    return () => { sb.removeChannel(channel); };
  }, [flightId]);

  const handleSeatClick = useCallback((seat: Seat) => {
    if (!seat.is_available) return;
    // Optimistic update
    setOptimistic(seat.id);
    setSelectedSeat(seat);
    onSeatConfirmed(seat);
  }, [setOptimistic, setSelectedSeat, onSeatConfirmed]);

  const getSeatState = (seat: Seat): 'available' | 'selected' | 'occupied' | 'optimistic' => {
    if (!seat.is_available)                                    return 'occupied';
    // optimistic: user clicked, RPC not yet confirmed
    if (seat.id === optimisticSeatId && seat.id !== selectedSeat?.id) return 'optimistic';
    // selected: confirmed selection (or optimistic + confirmed match)
    if (seat.id === selectedSeat?.id)                          return 'selected';
    return 'available';
  };

  const getSeatClasses = (seat: Seat) => {
    const state = getSeatState(seat);
    const base  = 'relative rounded-md w-8 h-9 sm:w-9 sm:h-10 flex items-center justify-center text-[10px] font-bold border-2 transition-all';
    if (state === 'occupied')   return `${base} bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed`;
    if (state === 'selected' || state === 'optimistic')
      return `${base} bg-green-500 text-white border-green-600 ring-2 ring-green-300 scale-110 cursor-pointer`;
    return `${base} ${CLASS_COLORS[seat.class]} cursor-pointer hover:scale-105 hover:shadow-md`;
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-xs">
        {[
          { label: 'First', cls: 'bg-amber-400' },
          { label: 'Business', cls: 'bg-purple-400' },
          { label: 'Economy', cls: 'bg-blue-400' },
          { label: 'Selected', cls: 'bg-green-500' },
          { label: 'Occupied', cls: 'bg-slate-200 border border-slate-300' },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-4 h-4 rounded ${cls}`} />
            <span className="text-slate-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Column headers */}
      <div className="min-w-[280px]">
        <div className="flex items-center justify-center gap-1 mb-2 ml-8">
          {COLS.map((col, i) =>
            col === '' ? (
              <div key={`aisle-${i}`} className="w-3" />
            ) : (
              <div key={col} className="w-8 sm:w-9 text-center text-xs font-bold text-slate-400">
                {col}
              </div>
            )
          )}
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-1.5 max-h-[60vh] overflow-y-auto pr-2 touch-pan-y">
          {ROWS.map((row) => {
            const isFirstClass    = row <= 2;
            const isBusinessClass = row > 2 && row <= 8;
            return (
              <div key={row}>
                {/* Class zone labels */}
                {row === 1 && (
                  <div className="text-center text-xs font-bold text-amber-600 mb-1 bg-amber-50 rounded py-0.5">
                    ✦ First Class (Rows 1–2)
                  </div>
                )}
                {row === 3 && (
                  <div className="text-center text-xs font-bold text-purple-600 mb-1 bg-purple-50 rounded py-0.5">
                    ◆ Business Class (Rows 3–8)
                  </div>
                )}
                {row === 9 && (
                  <div className="text-center text-xs font-bold text-blue-600 mb-1 bg-blue-50 rounded py-0.5">
                    ● Economy Class (Rows 9–30)
                  </div>
                )}

                <div className="flex items-center justify-center gap-1">
                  <span className="w-7 text-right text-xs text-slate-400 mr-1">{row}</span>
                  {COLS.map((col, i) => {
                    if (col === '') return <div key={`aisle-${i}`} className="w-3" />;
                    const seatNumber = `${row}${col}`;
                    const seat = seats.get(seatNumber);
                    if (!seat) return <div key={seatNumber} className="w-8 sm:w-9 h-9 sm:h-10" />;

                    return (
                      <button
                        key={seatNumber}
                        disabled={!seat.is_available}
                        onClick={() => handleSeatClick(seat)}
                        onMouseEnter={(e) =>
                          setTooltip({ seat, x: e.clientX, y: e.clientY })
                        }
                        onMouseLeave={() => setTooltip(null)}
                        className={getSeatClasses(seat)}
                        aria-label={`Seat ${seatNumber} - ${seat.class} - ${seat.is_available ? 'available' : 'occupied'}`}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl"
          style={{ top: tooltip.y - 60, left: tooltip.x - 60 }}
        >
          <p className="font-bold">{tooltip.seat.seat_number}</p>
          <p className="capitalize">{tooltip.seat.class}</p>
          {tooltip.seat.extra_fee > 0 && (
            <p>+₹{tooltip.seat.extra_fee.toLocaleString()}</p>
          )}
          <p>{tooltip.seat.is_available ? '✓ Available' : '✗ Occupied'}</p>
        </div>
      )}
    </div>
  );
}
