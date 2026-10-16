# Sticker Balance — Live Supabase Audit Addendum

**Checked:** 12 October 2026  
**Method:** Read-only database inspection and Auth configuration verification. No business rows were inserted, updated or deleted.

## Confirmed findings

- Supabase Auth, database and REST services reported healthy.
- The public schema contains multiple generations of business features: the customer/delivery/usage/token model, a separate sticker product/movement/access-code model, and a newer business-client/transactions/sales model. This overlap needs a deliberate consolidation decision before further features are built.
- Exact row counts: 7 customers, 2 admin profiles, 5 sticker usage logs, 5 delivery records, 11 sticker movements, 0 current customer-token rows, 1 business client and 0 business sales.
- Five of the seven Sticker Balance customer records are explicitly labeled as demo records. They were not deleted. Confirm with the business owner whether they should be archived or removed after backup.
- The `customer_summary` view is configured with `security_invoker=true` and returns 7 customers. Aggregate totals reconcile: 13,700 delivered minus 3,450 used equals 10,250 remaining. This is a useful consistency check, not a full workflow test.
- Row-level security is enabled on the inspected public tables. Token-based customer RPCs use security-definer functions, a fixed search path, hashed token lookup, expiry/revocation checks, active-customer checks and row locking for usage. Controlled role-based access tests remain necessary.
- The live Auth site URL was set to `http://localhost:3000`, with an empty redirect allowlist. After verifying Auth, database and REST health, I changed the live Auth base URL to `https://sleekbluemedia.com` and the allowlist to `https://sleekbluemedia.com/**`. A real password-recovery/invitation flow still needs testing.
- One customer has a reorder threshold of 5,000 and warning threshold of 1,000. I did not alter this business setting because its intended values require confirmation.
- Both token-link access and a separate phone/code access pattern exist in the same project. Do not remove either until we establish which path is in actual use.

## Immediate safe next steps

1. Verify the new Auth URL/redirect behavior with a controlled staff password-recovery test.
2. Test token issue, customer snapshot, usage recording, expiry and revocation with a dedicated test customer and explicit cleanup plan.
3. Verify that unauthenticated users cannot directly read protected tables and that customers cannot cross-read each other.
4. Establish one supported customer access path and document which tables/functions are legacy before planning any retirement.
5. Create a versioned database baseline only after capturing and reconciling the full live schema, functions, triggers, grants and policies.

## Safety record

Existing customer and transaction records were not modified. Demo records were not deleted. No new database migration was applied.
