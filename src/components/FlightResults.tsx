'use client';

import { useRouter } from 'next/navigation';
import { FlightCard } from '@/components/FlightCard';
import { useFlightStore } from '@/store/flightStore';
import type { Flight } from '@/types';
import { PlaneTakeoff } from 'lucide-react';

interface Props { flights: Flight[] }

export function FlightResults({ flights }: Props) {
  const router          = useRouter();
  const setFlight       = useFlightStore((s) => s.setSelectedFlight);
  const selectedFlight  = useFlightStore((s) => s.selectedFlight);
  const setStep         = useFlightStore((s) => s.setCurrentStep);

  const handleSelect = (f: Flight) => {
    setFlight(f);
    setStep('seats');
    router.push(`/booking/${f.id}/seats`);
  };

  if (flights.length === 0) {
    return (
      <div className="text-center py-20">
        <PlaneTakeoff className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No flights found for this route and date.</p>
        <p className="text-slate-400 text-sm mt-1">Try a different date or route.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {flights.map((f) => (
        <FlightCard
          key={f.id}
          flight={f}
          onSelect={handleSelect}
          selected={selectedFlight?.id === f.id}
        />
      ))}
    </div>
  );
}
