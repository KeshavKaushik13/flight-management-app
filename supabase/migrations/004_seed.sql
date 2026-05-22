-- ============================================================
-- Migration 004: Seed Data
-- 8 flights across 4 routes with full seat maps
-- ============================================================

-- Insert flights
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES
-- Route 1: DEL → BOM
('11111111-0000-0000-0000-000000000001', 'AI101', 'Delhi (DEL)', 'Mumbai (BOM)',
 now() + INTERVAL '2 days 08:00', now() + INTERVAL '2 days 10:00', 'Airbus A320', 'scheduled', 4500),
('11111111-0000-0000-0000-000000000002', 'AI103', 'Delhi (DEL)', 'Mumbai (BOM)',
 now() + INTERVAL '3 days 14:00', now() + INTERVAL '3 days 16:00', 'Boeing 737', 'scheduled', 3800),

-- Route 2: BOM → BLR
('22222222-0000-0000-0000-000000000001', 'AI201', 'Mumbai (BOM)', 'Bengaluru (BLR)',
 now() + INTERVAL '2 days 06:00', now() + INTERVAL '2 days 07:30', 'Airbus A320', 'scheduled', 3200),
('22222222-0000-0000-0000-000000000002', 'AI203', 'Mumbai (BOM)', 'Bengaluru (BLR)',
 now() + INTERVAL '4 days 18:00', now() + INTERVAL '4 days 19:30', 'Boeing 737', 'scheduled', 2900),

-- Route 3: BLR → HYD
('33333333-0000-0000-0000-000000000001', 'AI301', 'Bengaluru (BLR)', 'Hyderabad (HYD)',
 now() + INTERVAL '1 day 09:00', now() + INTERVAL '1 day 10:00', 'Airbus A320', 'scheduled', 2500),
('33333333-0000-0000-0000-000000000002', 'AI303', 'Bengaluru (BLR)', 'Hyderabad (HYD)',
 now() + INTERVAL '5 days 11:00', now() + INTERVAL '5 days 12:00', 'Boeing 737', 'scheduled', 2200),

-- Route 4: DEL → BLR
('44444444-0000-0000-0000-000000000001', 'AI401', 'Delhi (DEL)', 'Bengaluru (BLR)',
 now() + INTERVAL '2 days 07:00', now() + INTERVAL '2 days 09:45', 'Airbus A321', 'scheduled', 5500),
('44444444-0000-0000-0000-000000000002', 'AI403', 'Delhi (DEL)', 'Bengaluru (BLR)',
 now() + INTERVAL '6 days 20:00', now() + INTERVAL '6 days 22:45', 'Boeing 737', 'scheduled', 4800);

-- ── Seat generation function (called per flight) ──────────────
CREATE OR REPLACE FUNCTION seed_seats_for_flight(p_flight_id UUID)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  row_num INT;
  col     TEXT;
  cols    TEXT[] := ARRAY['A','B','C','D','E','F'];
  s_class TEXT;
  s_fee   NUMERIC;
BEGIN
  FOR row_num IN 1..30 LOOP
    FOREACH col IN ARRAY cols LOOP
      IF row_num <= 2 THEN
        s_class := 'first';    s_fee := 8000;
      ELSIF row_num <= 8 THEN
        s_class := 'business'; s_fee := 3500;
      ELSE
        s_class := 'economy';  s_fee := 0;
      END IF;

      INSERT INTO seats (flight_id, seat_number, class, is_available, extra_fee)
      VALUES (p_flight_id, row_num || col, s_class, true, s_fee)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

-- Seed seats for all 8 flights
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000002');

-- Mark a few seats as already taken (for realism)
UPDATE seats SET is_available = false
WHERE flight_id = '11111111-0000-0000-0000-000000000001'
  AND seat_number IN ('3A','3B','5C','7D','10A','10B','15F','20C');

UPDATE seats SET is_available = false
WHERE flight_id = '22222222-0000-0000-0000-000000000001'
  AND seat_number IN ('4A','4B','6C','9D','12A','18B');

UPDATE seats SET is_available = false
WHERE flight_id = '44444444-0000-0000-0000-000000000001'
  AND seat_number IN ('1A','2B','5C','8D','11A','25F');

-- ── Test User ────────────────────────────────────────────────
-- Cannot be created via SQL (Supabase Auth manages users).
-- Create manually in Supabase Dashboard → Authentication → Users → Add user:
--   Email:    test@skybook.dev
--   Password: Test@123456
-- OR run this in your terminal after setting SUPABASE_SERVICE_ROLE_KEY:
--   curl -X POST https://YOUR_PROJECT.supabase.co/auth/v1/admin/users \
--     -H "apikey: YOUR_SERVICE_ROLE_KEY" \
--     -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--     -H "Content-Type: application/json" \
--     -d '{"email":"test@skybook.dev","password":"Test@123456","email_confirm":true}'
