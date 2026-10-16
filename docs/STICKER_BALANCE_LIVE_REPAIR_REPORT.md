# Sticker Balance live repair report

Date: 2026-10-12

## Production change

Applied migration `sticker_balance_alert_integrity_20261012` to Supabase project `sjyclvtbcrgufhijzmim`. The migration replaces only four database functions/adds one helper function and revokes direct execution of the helper from public/anon/authenticated. It does not insert, update, or delete business rows.

## Read-back checks

- Function signatures remain compatible with current frontend RPC calls.
- `create_sticker_balance_alert_if_crossed(uuid, integer, integer)` is SECURITY DEFINER with fixed `search_path=public`.
- `record_sticker_usage`, `record_sticker_usage_with_token`, and `customer_access_snapshot` remain SECURITY DEFINER with fixed search paths.
- `anon` and `authenticated` cannot execute the helper directly; intended RPC execute permissions are present.
- Counts after migration: customers 7; profiles 2; sticker_logs 5; deliveries 5; customer_access_tokens 0; sticker_movements 11; business_clients 1; business_sales 0.
- Aggregate reconciliation: delivered 13,700; used 3,450; computed remaining 10,250.
- Migration appears in Supabase migration history as `sticker_balance_alert_integrity_20261012`, version `20261012173224`.

## Limitations

No valid staging database with a copy of the live schema was available through the created ephemeral branch, so the migration was applied after exact signature/schema review, not after a full staging test. No real customer transaction was created for verification. Automated CI passing validates the frontend build/tests only, not database runtime behavior. End-to-end auth, token isolation, concurrent usage, and browser/deployment checks remain required.
