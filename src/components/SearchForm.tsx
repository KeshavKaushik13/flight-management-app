'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Calendar, Users, ArrowRight } from 'lucide-react';
import { useFlightStore } from '@/store/flightStore';

const AIRPORTS = [
  'Delhi (DEL)',
  'Mumbai (BOM)',
  'Bengaluru (BLR)',
  'Hyderabad (HYD)',
];

export function SearchForm() {
  const router       = useRouter();
  const searchQuery  = useFlightStore((s) => s.searchQuery);
  const setSearch    = useFlightStore((s) => s.setSearchQuery);
  const setStep      = useFlightStore((s) => s.setCurrentStep);

  const [form, setForm] = useState(searchQuery);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.origin || !form.destination || !form.date) {
      setError('Please fill in all fields.');
      return;
    }
    if (form.origin === form.destination) {
      setError('Origin and destination cannot be the same.');
      return;
    }
    setSearch(form);
    setStep('results');
    router.push(
      `/flights?origin=${encodeURIComponent(form.origin)}&destination=${encodeURIComponent(form.destination)}&date=${form.date}&passengers=${form.passengers}`
    );
  };

  return (
    <form onSubmit={handleSubmit} className="card shadow-2xl text-left">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Origin */}
        <div>
          <label className="label">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="input pl-9"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            >
              <option value="">Select airport</option>
              {AIRPORTS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination */}
        <div>
          <label className="label">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="input pl-9"
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
            >
              <option value="">Select airport</option>
              {AIRPORTS.filter((a) => a !== form.origin).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date */}
        <div>
          <label className="label">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="date"
              className="input pl-9"
              min={new Date().toISOString().split('T')[0]}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        {/* Passengers */}
        <div>
          <label className="label">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              className="input pl-9"
              value={form.passengers}
              onChange={(e) => setForm({ ...form, passengers: Number(e.target.value) })}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <button type="submit" className="btn-primary w-full mt-5 py-3 text-base">
        Search Flights <ArrowRight className="h-5 w-5" />
      </button>
    </form>
  );
}
