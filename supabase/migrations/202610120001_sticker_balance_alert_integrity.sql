-- Sticker Balance transaction/alert integrity repair.
-- Apply only after reviewing the live schema and testing in a non-production project.
-- Does not modify customer records, balances, thresholds, or existing alert rows.

CREATE OR REPLACE FUNCTION public.create_sticker_balance_alert_if_crossed(
  p_customer_id uuid,
  p_previous_remaining integer,
  p_new_remaining integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reorder_threshold integer;
  v_warning_threshold integer;
  v_alert_type text;
  v_message text;
BEGIN
  IF p_customer_id IS NULL
     OR p_previous_remaining IS NULL
     OR p_new_remaining IS NULL
     OR p_new_remaining >= p_previous_remaining THEN
    RETURN;
  END IF;

  SELECT LEAST(reorder_level, warning_level),
         GREATEST(reorder_level, warning_level)
    INTO v_reorder_threshold, v_warning_threshold
    FROM public.customers
   WHERE id = p_customer_id
     AND is_active = true;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Treat the lower configured value as the reorder threshold and the
  -- higher configured value as the warning threshold. This keeps alerts
  -- meaningful even if a customer's two legacy values are reversed.
  IF p_previous_remaining > v_warning_threshold
     AND p_new_remaining <= v_reorder_threshold THEN
    v_alert_type := 'REORDER';
    v_message := 'Sticker balance has reached the reorder level.';
  ELSIF p_previous_remaining > v_warning_threshold
     AND p_new_remaining <= v_warning_threshold THEN
    v_alert_type := 'LOW_STOCK';
    v_message := 'Sticker balance is approaching the reorder level.';
  ELSIF p_previous_remaining > v_reorder_threshold
     AND p_new_remaining <= v_reorder_threshold THEN
    v_alert_type := 'REORDER';
    v_message := 'Sticker balance has reached the reorder level.';
  ELSE
    RETURN;
  END IF;

  INSERT INTO public.alerts(customer_id, alert_type, channel, message)
  VALUES (p_customer_id, v_alert_type, 'in_app', v_message);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_sticker_balance_alert_if_crossed(uuid, integer, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_sticker_balance_alert_if_crossed(uuid, integer, integer) FROM anon;
REVOKE ALL ON FUNCTION public.create_sticker_balance_alert_if_crossed(uuid, integer, integer) FROM authenticated;

CREATE OR REPLACE FUNCTION public.record_sticker_usage(
  p_customer_id uuid,
  p_quantity_used integer
)
RETURNS TABLE(
  log_id uuid,
  customer_id uuid,
  quantity_used integer,
  remaining_after integer,
  logged_by uuid,
  logged_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_delivered integer;
  v_used integer;
  v_remaining integer;
  v_log public.sticker_logs;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_quantity_used IS NULL OR p_quantity_used <= 0 THEN
    RAISE EXCEPTION 'Quantity used must be greater than zero';
  END IF;
  IF NOT public.is_admin()
     AND public.customer_id_for_user() IS DISTINCT FROM p_customer_id THEN
    RAISE EXCEPTION 'Not authorized for this customer';
  END IF;

  SELECT current_delivered INTO v_delivered
    FROM public.customers
   WHERE id = p_customer_id AND is_active = true
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or inactive';
  END IF;

  SELECT COALESCE(SUM(quantity_used), 0) INTO v_used
    FROM public.sticker_logs WHERE customer_id = p_customer_id;
  v_remaining := v_delivered - v_used;
  IF p_quantity_used > v_remaining THEN
    RAISE EXCEPTION 'Insufficient sticker balance';
  END IF;

  INSERT INTO public.sticker_logs(customer_id, quantity_used, remaining_after, logged_by)
  VALUES (p_customer_id, p_quantity_used, v_remaining - p_quantity_used, auth.uid())
  RETURNING * INTO v_log;

  PERFORM public.create_sticker_balance_alert_if_crossed(
    p_customer_id, v_remaining, v_remaining - p_quantity_used
  );

  RETURN QUERY
  SELECT v_log.id, v_log.customer_id, v_log.quantity_used,
         v_log.remaining_after, v_log.logged_by, v_log.logged_at;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_sticker_usage_with_token(
  p_token text,
  p_quantity_used integer
)
RETURNS TABLE(
  log_id uuid,
  customer_id uuid,
  quantity_used integer,
  remaining_after integer,
  logged_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_customer_id uuid;
  v_delivered integer;
  v_used integer;
  v_remaining integer;
  v_log public.sticker_logs;
BEGIN
  IF p_token IS NULL OR length(p_token) < 40 THEN
    RAISE EXCEPTION 'Invalid access token';
  END IF;
  IF p_quantity_used IS NULL OR p_quantity_used <= 0 THEN
    RAISE EXCEPTION 'Quantity used must be greater than zero';
  END IF;

  SELECT customer_id INTO v_customer_id
    FROM public.customer_access_tokens
   WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex')
     AND revoked_at IS NULL AND expires_at > now();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;

  SELECT current_delivered INTO v_delivered
    FROM public.customers
   WHERE id = v_customer_id AND is_active = true
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Customer not found or inactive';
  END IF;

  SELECT COALESCE(SUM(quantity_used), 0) INTO v_used
    FROM public.sticker_logs WHERE customer_id = v_customer_id;
  v_remaining := v_delivered - v_used;
  IF p_quantity_used > v_remaining THEN
    RAISE EXCEPTION 'Insufficient sticker balance';
  END IF;

  INSERT INTO public.sticker_logs(customer_id, quantity_used, remaining_after, logged_by)
  VALUES (v_customer_id, p_quantity_used, v_remaining - p_quantity_used, NULL)
  RETURNING * INTO v_log;

  PERFORM public.create_sticker_balance_alert_if_crossed(
    v_customer_id, v_remaining, v_remaining - p_quantity_used
  );

  RETURN QUERY
  SELECT v_log.id, v_log.customer_id, v_log.quantity_used,
         v_log.remaining_after, v_log.logged_at;
END;
$function$;

-- Keep the customer snapshot's status logic consistent with the UI and alert
-- thresholds. The balance calculation and JSON response contract are unchanged.
CREATE OR REPLACE FUNCTION public.customer_access_snapshot(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_customer_id uuid;
  v_customer jsonb;
BEGIN
  IF p_token IS NULL OR length(p_token) < 40 THEN
    RAISE EXCEPTION 'Invalid access token';
  END IF;

  SELECT customer_id INTO v_customer_id
    FROM public.customer_access_tokens
   WHERE token_hash = encode(digest(p_token, 'sha256'), 'hex')
     AND revoked_at IS NULL AND expires_at > now();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired access token';
  END IF;

  SELECT jsonb_build_object(
    'id', c.id,
    'business_name', c.business_name,
    'customer_code', c.customer_code,
    'contact_name', c.contact_name,
    'total_delivered', c.current_delivered,
    'total_used', COALESCE((SELECT SUM(quantity_used) FROM public.sticker_logs WHERE customer_id = c.id), 0),
    'remaining_balance', c.current_delivered - COALESCE((SELECT SUM(quantity_used) FROM public.sticker_logs WHERE customer_id = c.id), 0),
    'reorder_level', c.reorder_level,
    'warning_level', c.warning_level,
    'status', CASE
      WHEN c.current_delivered - COALESCE((SELECT SUM(quantity_used) FROM public.sticker_logs WHERE customer_id = c.id), 0) <= LEAST(c.reorder_level, c.warning_level) THEN 'REORDER NOW'
      WHEN c.current_delivered - COALESCE((SELECT SUM(quantity_used) FROM public.sticker_logs WHERE customer_id = c.id), 0) <= GREATEST(c.reorder_level, c.warning_level) THEN 'APPROACHING'
      ELSE 'OK'
    END
  )
  INTO v_customer
  FROM public.customers c
  WHERE c.id = v_customer_id AND c.is_active = true;

  IF v_customer IS NULL THEN
    RAISE EXCEPTION 'Customer not found or inactive';
  END IF;

  RETURN jsonb_build_object(
    'customer', v_customer,
    'usage', COALESCE((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.logged_at DESC)
      FROM (
        SELECT id, quantity_used, remaining_after, logged_at
        FROM public.sticker_logs
        WHERE customer_id = v_customer_id
        ORDER BY logged_at DESC LIMIT 100
      ) x
    ), '[]'::jsonb),
    'deliveries', COALESCE((
      SELECT jsonb_agg(to_jsonb(x) ORDER BY x.delivered_at DESC)
      FROM (
        SELECT id, quantity_delivered, delivered_at, notes
        FROM public.deliveries
        WHERE customer_id = v_customer_id
        ORDER BY delivered_at DESC LIMIT 100
      ) x
    ), '[]'::jsonb)
  );
END;
$function$;
