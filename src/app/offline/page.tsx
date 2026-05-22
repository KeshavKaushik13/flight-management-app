import Link from 'next/link';
import { WifiOff, BookOpen } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="text-center max-w-sm">
        <div className="rounded-full bg-slate-100 p-6 inline-flex mb-6">
          <WifiOff className="h-12 w-12 text-slate-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">You&apos;re offline</h1>
        <p className="text-slate-500 text-sm mb-8">
          No internet connection detected. Your previously loaded bookings and
          flight data may still be available below.
        </p>
        <Link href="/bookings" className="btn-primary inline-flex gap-2">
          <BookOpen className="h-4 w-4" /> View Cached Bookings
        </Link>
      </div>
    </div>
  );
}
