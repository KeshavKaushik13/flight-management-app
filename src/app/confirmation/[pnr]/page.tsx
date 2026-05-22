import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { CheckCircle, Plane, User, MapPin } from 'lucide-react';
import { notFound } from 'next/navigation';
import type { Booking } from '@/types';

interface Props { params: { pnr: string } }

export default async function ConfirmationPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`*, flights(*), seats(*), passengers(*)`)
    .eq('pnr_code', params.pnr)
    .eq('user_id', user.id)
    .single();

  if (!booking) notFound();

  const b        = booking as Booking;
  const flight   = b.flights!;
  const seat     = b.seats!;
  const passenger = b.passengers?.[0];

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 py-14 text-center">
      <div className="flex flex-col items-center mb-8">
        <div className="rounded-full bg-green-100 p-5 mb-4">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">Booking Confirmed!</h1>
        <p className="text-slate-500 mt-2">Your seat is reserved. Safe travels!</p>
      </div>

      <div className="card text-left space-y-5">
        {/* PNR */}
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">PNR Code</p>
          <p className="text-3xl font-black text-blue-600 tracking-widest">{b.pnr_code}</p>
        </div>

        {/* Flight details */}
        <div>
          <p className="label mb-2">Flight Details</p>
          <div className="flex items-center gap-3">
            <Plane className="h-5 w-5 text-blue-500 shrink-0" />
            <div>
              <p className="font-semibold text-slate-800">{flight.flight_no}</p>
              <p className="text-sm text-slate-500">{flight.aircraft_type}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="label">Departs</p>
              <p className="font-bold text-slate-800">
                {format(new Date(flight.departs_at), 'HH:mm')}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {flight.origin.split(' (')[0]}
              </p>
              <p className="text-xs text-slate-400">
                {format(new Date(flight.departs_at), 'dd MMM yyyy')}
              </p>
            </div>
            <div>
              <p className="label">Arrives</p>
              <p className="font-bold text-slate-800">
                {format(new Date(flight.arrives_at), 'HH:mm')}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" /> {flight.destination.split(' (')[0]}
              </p>
              <p className="text-xs text-slate-400">
                {format(new Date(flight.arrives_at), 'dd MMM yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Seat */}
        <div>
          <p className="label">Seat Assignment</p>
          <p className="font-semibold text-slate-800 capitalize">
            {seat.seat_number} · {seat.class}
          </p>
        </div>

        {/* Passenger */}
        {passenger && (
          <div>
            <p className="label">Passenger</p>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <p className="font-semibold text-slate-800">{passenger.full_name}</p>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{passenger.nationality}</p>
          </div>
        )}

        {/* Price */}
        <div className="border-t border-slate-100 pt-4 flex justify-between font-bold text-blue-700">
          <span>Total Paid</span>
          <span>₹{b.total_price.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link href="/" className="btn-secondary flex-1">Search More Flights</Link>
        <Link href="/bookings" className="btn-primary flex-1">My Bookings</Link>
      </div>
    </div>
  );
}
