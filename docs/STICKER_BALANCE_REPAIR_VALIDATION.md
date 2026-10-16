# Sticker Balance repair validation checklist

This checklist accompanies migration `202610120001_sticker_balance_alert_integrity.sql`.

## Current release status — 2026-10-12

- The migration was applied successfully to the live Supabase project and recorded in migration history as `sticker_balance_alert_integrity_20261012`.
- Live function signatures and SECURITY DEFINER/search_path settings were read back after application.
- The helper cannot be executed directly by `anon` or `authenticated`; intended public RPC execute privileges remain present.
- Row counts remained unchanged: 7 customers, 2 profiles, 5 usage logs, 5 deliveries, 0 customer access tokens, 11 sticker movements, 1 business client, 0 business sales.
- Aggregate balance still reconciles: 13,700 delivered minus 3,450 used = 10,250 remaining.
- CI build and automated tests passed for commit `3202310bd1f2783c329dbaed8639114dc8d3e0fc`.

**Important:** the available ephemeral branch did not contain a copy of the production schema/data, so it was not a valid staging environment. End-to-end authenticated transaction, concurrency, and browser tests are still outstanding. The live migration is applied, but the full release is not considered end-to-end verified until those tests pass.

## Changes in this repair

- Both staff-authenticated and customer-token usage RPCs use one threshold-crossing alert helper.
- Alerts are emitted only when a usage transaction crosses a warning/reorder boundary, rather than on every usage record while a balance remains low.
- Thresholds are normalized with `LEAST`/`GREATEST` for status and alert decisions. Existing customer threshold values are not rewritten.
- The token snapshot retains its existing response shape and token hash/expiry/revocation checks.
- The UI status badge uses the same normalized threshold ordering.

## Remaining validation before declaring end-to-end complete

1. Test positive usage; reject zero, negative, non-integer and over-balance usage.
2. Test two concurrent usage attempts against a balance that can cover only one; only one must succeed.
3. Test valid, expired, revoked, malformed, and cross-customer tokens. A token must reveal only its own customer's snapshot and must not permit an admin operation.
4. Test threshold crossings: above warning to between thresholds => one LOW_STOCK alert; above warning to at/below reorder => one REORDER alert; repeated use below a threshold => no repeated alert; delivery replenishment then crossing again => a new alert.
5. Test both reversed and correctly ordered legacy threshold values. Do not silently rewrite thresholds.
6. Confirm admin delivery still increments `current_delivered` and writes one delivery row atomically.
7. Reconcile each test customer's delivered total minus usage total with displayed remaining balance.
8. Test the customer portal, staff login, link creation/revocation, and password recovery in the browser.
9. Verify the deployed website is serving the merged frontend commit and check the Hostinger deployment result.
10. Keep the parallel product/movement/access-code schema until a separately reviewed data-path migration plan exists.

## Explicitly not changed

- No live customer data, balances, historical alerts, or thresholds.
- No deletion of demo or legacy records.
- No retirement of the parallel product/movement/access-code schema.
- No alteration of token expiry policy or customer login flow.
