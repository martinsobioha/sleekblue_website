# Sticker Balance: transaction integrity repair

Date: 2026-10-12

## Confirmed defects

The customer portal's status function and database snapshot compared `reorder_level` before `warning_level`. When a legacy customer's values are reversed, the status can be misleading. The token usage RPC also inserted an alert on every use while the balance stayed below a threshold, while the authenticated staff usage RPC did not create corresponding low-stock alerts.

## Repair applied

Migration `supabase/migrations/202610120001_sticker_balance_alert_integrity.sql` was applied successfully to the live Supabase project on 2026-10-12 and recorded in migration history as `sticker_balance_alert_integrity_20261012`.

It introduces a shared threshold-crossing helper used by both usage RPCs and normalizes threshold ordering in the customer snapshot. The frontend status indicator applies the same normalization. The helper is not executable by anon/authenticated roles directly; it is called by the existing SECURITY DEFINER transaction functions.

The live function signatures and security configuration were read back after the migration. Customer/table counts and aggregate balances were rechecked and unchanged.

This migration does not change customer records, delivered/used quantities, existing alerts, or configured thresholds. It changes alert behavior only for new usage transactions after rollout.

## Release status

- Source commit: `3202310bd1f2783c329dbaed8639114dc8d3e0fc` on `audit/sticker-balance-foundation`.
- Automated build/tests passed for that commit.
- Live database migration applied and verified by read-back.
- Frontend change is in PR #8 and must be merged/deployed before the UI correction is live.
- Full end-to-end validation remains outstanding: authenticated staff/customer transaction tests, concurrency tests, token-isolation tests, and browser smoke tests.
- Live `customer_access_tokens` has zero rows; generate a fresh link and test it in the browser before relying on the token-link flow.
- Existing schema generations remain in place pending an explicit data-path migration plan.

Do not describe the application as fully end-to-end verified until the remaining release checks pass.
