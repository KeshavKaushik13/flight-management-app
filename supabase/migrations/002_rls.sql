-- ============================================================
-- Migration 002: Row Level Security
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE flights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats      ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- ── FLIGHTS: anyone can read (public timetable) ──────────────
CREATE POLICY "flights_public_read"
  ON flights FOR SELECT
  USING (true);

-- ── SEATS: anyone can read (seat map is public) ──────────────
CREATE POLICY "seats_public_read"
  ON seats FOR SELECT
  USING (true);

-- ── SEATS: RPC functions (SECURITY DEFINER) bypass RLS,
-- but add explicit authenticated update for belt-and-suspenders ──
CREATE POLICY "seats_rpc_update"
  ON seats FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── BOOKINGS: users see only their own ──────────────────────
CREATE POLICY "bookings_owner_select"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "bookings_owner_insert"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookings_owner_update"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── PASSENGERS: via booking ownership ────────────────────────
CREATE POLICY "passengers_owner_select"
  ON passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "passengers_owner_insert"
  ON passengers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

-- ── RESCHEDULES: via booking ownership ───────────────────────
CREATE POLICY "reschedules_owner_select"
  ON reschedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "reschedules_owner_insert"
  ON reschedules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = booking_id AND b.user_id = auth.uid()
    )
  );
