import { format, differenceInMinutes } from 'date-fns';
import { Plane, Clock } from 'lucide-react';
import type { Flight } from '@/types';

interface Props {
  flight:    Flight;
  onSelect?: (f: Flight) => void;
  selected?: boolean;
}

function durationLabel(departs: string, arrives: string) {
  const mins = differenceInMinutes(new Date(arrives), new Date(departs));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// Seat class pricing derived from seeded extra_fee values
const CLASS_OPTIONS = [
  { label: 'Economy',  fee: 0,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
  { label: 'Business', fee: 3500, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'First',    fee: 8000, color: 'text-amber-600',  bg: 'bg-amber-50'  },
];

export function FlightCard({ flight, onSelect, selected }: Props) {
  return (
    <div
      className={`card transition cursor-pointer border-2 ${
        selected ? 'border-blue-500 shadow-md' : 'border-transparent hover:border-blue-200'
      }`}
      onClick={() => onSelect?.(flight)}
    >
      {/* Route row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="text-center shrink-0">
            <p className="text-xl font-bold text-slate-800">
              {format(new Date(flight.departs_at), 'HH:mm')}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[80px]">
              {flight.origin.split(' (')[0]}
            </p>
          </div>
          <div className="flex-1 flex flex-col items-center gap-1">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {durationLabel(flight.departs_at, flight.arrives_at)}
            </span>
            <div className="relative w-full h-px bg-slate-200">
              <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-xs text-slate-400">{flight.flight_no} · {flight.aircraft_type}</span>
          </div>
          <div className="text-center shrink-0">
            <p className="text-xl font-bold text-slate-800">
              {format(new Date(flight.arrives_at), 'HH:mm')}
            </p>
            <p className="text-xs text-slate-400 truncate max-w-[80px]">
              {flight.destination.split(' (')[0]}
            </p>
          </div>
        </div>

        {/* Base price */}
        <div className="sm:text-right shrink-0">
          <p className="text-xs text-slate-400">from</p>
          <p className="text-2xl font-bold text-blue-600">₹{flight.base_price.toLocaleString()}</p>
        </div>
      </div>

      {/* Class options row */}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {CLASS_OPTIONS.map(({ label, fee, color, bg }) => (
          <button
            key={label}
            onClick={(e) => { e.stopPropagation(); onSelect?.(flight); }}
            className={`flex items-center gap-1.5 rounded-lg ${bg} px-3 py-1.5 text-xs font-semibold ${color} border border-transparent hover:border-current transition`}
          >
            <span>{label}</span>
            <span className="font-normal opacity-75">
              ₹{(flight.base_price + fee).toLocaleString()}
            </span>
          </button>
        ))}
        {onSelect && (
          <button
            className="btn-primary ml-auto py-1.5 px-4 text-xs"
            onClick={(e) => { e.stopPropagation(); onSelect(flight); }}
          >
            Select →
          </button>
        )}
      </div>
    </div>
  );
}
