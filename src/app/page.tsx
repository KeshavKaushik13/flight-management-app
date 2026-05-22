import { SearchForm } from '@/components/SearchForm';
import { Plane, Shield, Zap } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
      {/* Hero */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-32 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm text-white mb-6">
          <Plane className="h-4 w-4" /> India&apos;s simplest flight booking
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Where do you want to fly?
        </h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto mb-12">
          Search hundreds of routes, pick your seat, and manage your bookings — all in one place.
        </p>

        {/* Search card */}
        <div className="mx-auto max-w-3xl">
          <SearchForm />
        </div>
      </div>

      {/* Feature strips */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { icon: Zap,    title: 'Instant Booking', desc: 'Your seat is locked in seconds with race-condition-proof reservations.' },
              { icon: Shield, title: 'Secure Payments', desc: 'End-to-end encrypted. Your passport details never hit localStorage.' },
              { icon: Plane,  title: 'Live Seat Map',   desc: 'Watch seats fill up in real time. Powered by Supabase Realtime.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-800">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
