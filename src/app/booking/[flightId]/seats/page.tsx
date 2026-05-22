import { createClient } from '@/lib/supabase/server';
import { SeatSelectionClient } from '@/components/SeatSelectionClient';
import type { Seat, Flight } from '@/types';
import { notFound } from 'next/navigation';

interface Props { params: { flightId: string } }

export default async function SeatsPage({ params }: Props) {
  const supabase = createClient();

  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', params.flightId)
    .single();

  if (!flight) notFound();

  const { data: seats } = await supabase
    .from('seats')
    .select('*')
    .eq('flight_id', params.flightId)
    .order('seat_number');

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Choose Your Seat</h1>
      <p className="text-slate-500 text-sm mb-6">
        {(flight as Flight).flight_no} · {(flight as Flight).origin.split(' (')[0]} → {(flight as Flight).destination.split(' (')[0]}
      </p>
      <SeatSelectionClient
        flight={flight as Flight}
        initialSeats={(seats as Seat[]) ?? []}
      />
    </div>
  );
}
