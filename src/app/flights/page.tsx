import { createClient } from '@/lib/supabase/server';
import { FlightResults } from '@/components/FlightResults';
import type { Flight } from '@/types';

interface Props {
  searchParams: { origin?: string; destination?: string; date?: string; passengers?: string };
}

export default async function FlightsPage({ searchParams }: Props) {
  const { origin, destination, date } = searchParams;

  if (!origin || !destination || !date) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-slate-500">Please go back and fill in your search.</p>
      </div>
    );
  }

  const supabase = createClient();
  const dateStart = `${date}T00:00:00`;
  const dateEnd   = `${date}T23:59:59`;

  const { data: flights, error } = await supabase
    .from('flights')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .gte('departs_at', dateStart)
    .lte('departs_at', dateEnd)
    .neq('status', 'cancelled')
    .order('departs_at');

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800">
          {origin.split(' (')[0]} → {destination.split(' (')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          {' · '}{searchParams.passengers ?? 1} passenger(s)
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-red-700 text-sm mb-4">
          Failed to load flights: {error.message}
        </div>
      )}

      <FlightResults flights={(flights as Flight[]) ?? []} />
    </div>
  );
}
