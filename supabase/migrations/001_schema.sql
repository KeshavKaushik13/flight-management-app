-- ============================================================
-- Migration 001: Core Schema
-- ============================================================

-- FLIGHTS
CREATE TABLE IF NOT EXISTS flights (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_no      TEXT NOT NULL UNIQUE,
  origin         TEXT NOT NULL,
  destination    TEXT NOT NULL,
  departs_at     TIMESTAMPTZ NOT NULL,
  arrives_at     TIMESTAMPTZ NOT NULL,
  aircraft_type  TEXT NOT NULL DEFAULT 'Boeing 737',
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','boarding','departed','arrived','cancelled')),
  base_price     NUMERIC(10,2) NOT NULL CHECK (base_price > 0)
);

-- SEATS
CREATE TABLE IF NOT EXISTS seats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flight_id     UUID NOT NULL REFERENCES flights(id) ON DELETE CASCADE,
  seat_number   TEXT NOT NULL,
  class         TEXT NOT NULL CHECK (class IN ('economy','business','first')),
  is_available  BOOLEAN NOT NULL DEFAULT true,
  extra_fee     NUMERIC(10,2) NOT NULL DEFAULT 0,
  UNIQUE (flight_id, seat_number)
);

-- BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flight_id   UUID NOT NULL REFERENCES flights(id),
  seat_id     UUID NOT NULL REFERENCES seats(id),
  status      TEXT NOT NULL DEFAULT 'confirmed'
                CHECK (status IN ('confirmed','rescheduled','cancelled')),
  booked_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_price NUMERIC(10,2) NOT NULL,
  pnr_code    TEXT NOT NULL UNIQUE
);

-- PASSENGERS
CREATE TABLE IF NOT EXISTS passengers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  passport_no  TEXT NOT NULL,
  nationality  TEXT NOT NULL,
  dob          DATE NOT NULL
);

-- RESCHEDULES
CREATE TABLE IF NOT EXISTS reschedules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  old_flight_id  UUID NOT NULL REFERENCES flights(id),
  new_flight_id  UUID NOT NULL REFERENCES flights(id),
  requested_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  fee_charged    NUMERIC(10,2) NOT NULL DEFAULT 0
);
