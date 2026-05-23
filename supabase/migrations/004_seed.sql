-- ============================================================
-- Migration 004: Seed Data
-- 20 flights across 4 routes (5 per route) over next 14 days
-- ============================================================

-- ── Seat generation function ──────────────────────────────
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

-- ── Insert flights ────────────────────────────────────────
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price) VALUES
-- Route 1: DEL → BOM
('11111111-0000-0000-0000-000000000001', 'AI101', 'Delhi (DEL)', 'Mumbai (BOM)', now() + INTERVAL '2 days 8 hours',   now() + INTERVAL '2 days 10 hours',           'Airbus A320', 'scheduled', 4500),
('11111111-0000-0000-0000-000000000002', 'AI103', 'Delhi (DEL)', 'Mumbai (BOM)', now() + INTERVAL '3 days 14 hours',  now() + INTERVAL '3 days 16 hours',           'Boeing 737',  'scheduled', 3800),
('11111111-0000-0000-0000-000000000003', 'AI105', 'Delhi (DEL)', 'Mumbai (BOM)', now() + INTERVAL '5 days 6 hours',   now() + INTERVAL '5 days 8 hours',            'Airbus A321', 'scheduled', 4200),
('11111111-0000-0000-0000-000000000004', 'AI107', 'Delhi (DEL)', 'Mumbai (BOM)', now() + INTERVAL '7 days 18 hours',  now() + INTERVAL '7 days 20 hours',           'Boeing 737',  'scheduled', 3500),
('11111111-0000-0000-0000-000000000005', 'AI109', 'Delhi (DEL)', 'Mumbai (BOM)', now() + INTERVAL '10 days 9 hours',  now() + INTERVAL '10 days 11 hours',          'Airbus A320', 'scheduled', 4800),

-- Route 2: BOM → BLR
('22222222-0000-0000-0000-000000000001', 'AI201', 'Mumbai (BOM)', 'Bengaluru (BLR)', now() + INTERVAL '2 days 6 hours',   now() + INTERVAL '2 days 7 hours 30 minutes',  'Airbus A320', 'scheduled', 3200),
('22222222-0000-0000-0000-000000000002', 'AI203', 'Mumbai (BOM)', 'Bengaluru (BLR)', now() + INTERVAL '4 days 18 hours',  now() + INTERVAL '4 days 19 hours 30 minutes', 'Boeing 737',  'scheduled', 2900),
('22222222-0000-0000-0000-000000000003', 'AI205', 'Mumbai (BOM)', 'Bengaluru (BLR)', now() + INTERVAL '6 days 10 hours',  now() + INTERVAL '6 days 11 hours 30 minutes', 'Airbus A321', 'scheduled', 3100),
('22222222-0000-0000-0000-000000000004', 'AI207', 'Mumbai (BOM)', 'Bengaluru (BLR)', now() + INTERVAL '8 days 7 hours',   now() + INTERVAL '8 days 8 hours 30 minutes',  'Boeing 737',  'scheduled', 2800),
('22222222-0000-0000-0000-000000000005', 'AI209', 'Mumbai (BOM)', 'Bengaluru (BLR)', now() + INTERVAL '12 days 14 hours', now() + INTERVAL '12 days 15 hours 30 minutes','Airbus A320', 'scheduled', 3400),

-- Route 3: BLR → HYD
('33333333-0000-0000-0000-000000000001', 'AI301', 'Bengaluru (BLR)', 'Hyderabad (HYD)', now() + INTERVAL '1 day 9 hours',    now() + INTERVAL '1 day 10 hours',    'Airbus A320', 'scheduled', 2500),
('33333333-0000-0000-0000-000000000002', 'AI303', 'Bengaluru (BLR)', 'Hyderabad (HYD)', now() + INTERVAL '3 days 11 hours',  now() + INTERVAL '3 days 12 hours',  'Boeing 737',  'scheduled', 2200),
('33333333-0000-0000-0000-000000000003', 'AI305', 'Bengaluru (BLR)', 'Hyderabad (HYD)', now() + INTERVAL '5 days 15 hours',  now() + INTERVAL '5 days 16 hours',  'Airbus A321', 'scheduled', 2700),
('33333333-0000-0000-0000-000000000004', 'AI307', 'Bengaluru (BLR)', 'Hyderabad (HYD)', now() + INTERVAL '8 days 8 hours',   now() + INTERVAL '8 days 9 hours',   'Boeing 737',  'scheduled', 2100),
('33333333-0000-0000-0000-000000000005', 'AI309', 'Bengaluru (BLR)', 'Hyderabad (HYD)', now() + INTERVAL '11 days 12 hours', now() + INTERVAL '11 days 13 hours', 'Airbus A320', 'scheduled', 2400),

-- Route 4: DEL → BLR
('44444444-0000-0000-0000-000000000001', 'AI401', 'Delhi (DEL)', 'Bengaluru (BLR)', now() + INTERVAL '2 days 7 hours',   now() + INTERVAL '2 days 9 hours 45 minutes',   'Airbus A321', 'scheduled', 5500),
('44444444-0000-0000-0000-000000000002', 'AI403', 'Delhi (DEL)', 'Bengaluru (BLR)', now() + INTERVAL '4 days 20 hours',  now() + INTERVAL '4 days 22 hours 45 minutes',  'Boeing 737',  'scheduled', 4800),
('44444444-0000-0000-0000-000000000003', 'AI405', 'Delhi (DEL)', 'Bengaluru (BLR)', now() + INTERVAL '6 days 6 hours',   now() + INTERVAL '6 days 8 hours 45 minutes',   'Airbus A320', 'scheduled', 5200),
('44444444-0000-0000-0000-000000000004', 'AI407', 'Delhi (DEL)', 'Bengaluru (BLR)', now() + INTERVAL '9 days 13 hours',  now() + INTERVAL '9 days 15 hours 45 minutes',  'Boeing 737',  'scheduled', 4600),
('44444444-0000-0000-0000-000000000005', 'AI409', 'Delhi (DEL)', 'Bengaluru (BLR)', now() + INTERVAL '14 days 9 hours',  now() + INTERVAL '14 days 11 hours 45 minutes', 'Airbus A321', 'scheduled', 5800);

-- ── Seed seats for all 20 flights ────────────────────────
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000003');
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000004');
SELECT seed_seats_for_flight('11111111-0000-0000-0000-000000000005');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000003');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000004');
SELECT seed_seats_for_flight('22222222-0000-0000-0000-000000000005');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000003');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000004');
SELECT seed_seats_for_flight('33333333-0000-0000-0000-000000000005');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000001');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000002');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000003');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000004');
SELECT seed_seats_for_flight('44444444-0000-0000-0000-000000000005');

-- ── Test User ─────────────────────────────────────────────
-- Create manually in Supabase Dashboard → Authentication → Users → Add user:
--   Email:    test@boardpass.dev
--   Password: Test@123456
--   Check "Auto Confirm User"
