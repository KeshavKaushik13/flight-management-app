import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BookingsClient } from '@/components/BookingsClient';
import type { Booking } from '@/types';

export default async function BookingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?redirect=/bookings');

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`*, flights(*), seats(*), passengers(*)`)
    .eq('user_id', user.id)
    .order('booked_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-800 mb-1">My Bookings</h1>
      <p className="text-slate-500 text-sm mb-8">Manage your upcoming and past flights.</p>
      <BookingsClient
        initialBookings={(bookings as Booking[]) ?? []}
        userId={user.id}
      />
    </div>
  );
}
