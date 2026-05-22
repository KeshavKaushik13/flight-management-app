import type { BookingStatus } from '@/types';

export function StatusBadge({ status }: { status: BookingStatus }) {
  const map: Record<BookingStatus, string> = {
    confirmed:   'badge-confirmed',
    rescheduled: 'badge-rescheduled',
    cancelled:   'badge-cancelled',
  };
  return (
    <span className={map[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
