import { createClient } from '@/lib/supabase/server';
import { PassengerForm } from '@/components/PassengerForm';
import { redirect } from 'next/navigation';
import type { Flight } from '@/types';

interface Props { params: { flightId: string } }

export default async function PassengersPage({ params }: Props) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?redirect=/booking/${params.flightId}/passengers`);

  const { data: flight } = await supabase
    .from('flights')
    .select('*')
    .eq('id', params.flightId)
    .single();

  if (!flight) redirect('/');

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">Passenger Details</h1>
      <p className="text-slate-500 text-sm mb-8">
        Enter the traveller's information exactly as it appears on their passport.
      </p>
      <PassengerForm flight={flight as Flight} userId={user.id} />
    </div>
  );
}
