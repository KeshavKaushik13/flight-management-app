-- ============================================================
-- Migration 003: RPC Functions & Triggers
-- ============================================================

-- ── 1. Seat-locking RPC (prevents double-booking via FOR UPDATE) ──
CREATE OR REPLACE FUNCTION reserve_seat(
  p_flight_id   UUID,
  p_seat_id     UUID,
  p_user_id     UUID,
  p_total_price NUMERIC,
  p_pnr_code    TEXT,
  p_full_name   TEXT,
  p_passport_no TEXT,
  p_nationality TEXT,
  p_dob         DATE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seat        seats%ROWTYPE;
  v_booking_id  UUID;
BEGIN
  -- Lock the seat row to prevent concurrent reservations
  SELECT * INTO v_seat
  FROM seats
  WHERE id = p_seat_id AND flight_id = p_flight_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Seat not found');
  END IF;

  IF NOT v_seat.is_available THEN
    RETURN json_build_object('success', false, 'error', 'Seat is no longer available');
  END IF;

  -- Mark seat unavailable
  UPDATE seats SET is_available = false WHERE id = p_seat_id;

  -- Create the booking
  INSERT INTO bookings (user_id, flight_id, seat_id, total_price, pnr_code)
  VALUES (p_user_id, p_flight_id, p_seat_id, p_total_price, p_pnr_code)
  RETURNING id INTO v_booking_id;

  -- Insert passenger record
  INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
  VALUES (v_booking_id, p_full_name, p_passport_no, p_nationality, p_dob);

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;

-- ── 2. Cancel booking RPC (atomic cancel + seat free) ────────
CREATE OR REPLACE FUNCTION cancel_booking(
  p_booking_id UUID,
  p_user_id    UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_flight  flights%ROWTYPE;
BEGIN
  -- Fetch and lock the booking
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Booking already cancelled');
  END IF;

  -- Fetch associated flight
  SELECT * INTO v_flight FROM flights WHERE id = v_booking.flight_id;

  -- Enforce: cannot cancel within 2 hours of departure
  IF v_flight.departs_at - now() < INTERVAL '2 hours' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot cancel within 2 hours of departure'
    );
  END IF;

  -- Free the seat atomically
  UPDATE seats SET is_available = true WHERE id = v_booking.seat_id;

  -- Update booking status
  UPDATE bookings SET status = 'cancelled' WHERE id = p_booking_id;

  RETURN json_build_object('success', true);
END;
$$;

-- ── 3. Reschedule booking RPC ─────────────────────────────────
CREATE OR REPLACE FUNCTION reschedule_booking(
  p_booking_id    UUID,
  p_user_id       UUID,
  p_new_flight_id UUID,
  p_new_seat_id   UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking      bookings%ROWTYPE;
  v_old_flight   flights%ROWTYPE;
  v_new_flight   flights%ROWTYPE;
  v_new_seat     seats%ROWTYPE;
  v_fee          NUMERIC := 0;
BEGIN
  -- Lock booking row
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot reschedule a cancelled booking');
  END IF;

  SELECT * INTO v_old_flight FROM flights WHERE id = v_booking.flight_id;
  SELECT * INTO v_new_flight FROM flights WHERE id = p_new_flight_id;

  -- Lock and check new seat
  SELECT * INTO v_new_seat FROM seats WHERE id = p_new_seat_id FOR UPDATE;

  IF NOT v_new_seat.is_available THEN
    RETURN json_build_object('success', false, 'error', 'Selected seat is not available');
  END IF;

  -- Calculate fee if new flight costs more
  IF v_new_flight.base_price > v_old_flight.base_price THEN
    v_fee := v_new_flight.base_price - v_old_flight.base_price;
  END IF;

  -- Free old seat
  UPDATE seats SET is_available = true WHERE id = v_booking.seat_id;

  -- Reserve new seat
  UPDATE seats SET is_available = false WHERE id = p_new_seat_id;

  -- Record reschedule
  INSERT INTO reschedules (booking_id, old_flight_id, new_flight_id, fee_charged)
  VALUES (p_booking_id, v_booking.flight_id, p_new_flight_id, v_fee);

  -- Update booking
  UPDATE bookings
  SET flight_id = p_new_flight_id,
      seat_id   = p_new_seat_id,
      status    = 'rescheduled',
      total_price = v_booking.total_price + v_fee
  WHERE id = p_booking_id;

  RETURN json_build_object('success', true, 'fee_charged', v_fee);
END;
$$;

-- ── 4. DB-level trigger: block cancellations within 2 hours ───
-- (Belt-and-suspenders in addition to the RPC check)
CREATE OR REPLACE FUNCTION check_cancellation_window()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_departs_at TIMESTAMPTZ;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    SELECT departs_at INTO v_departs_at FROM flights WHERE id = NEW.flight_id;
    IF v_departs_at - now() < INTERVAL '2 hours' THEN
      RAISE EXCEPTION 'Cannot cancel a booking within 2 hours of departure';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_cancellation_window
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_cancellation_window();
