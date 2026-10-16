# Sticker Balance — Foundation Audit and Safe-Fix Plan

**Audit date:** 12 October 2026  
**Scope:** Read-only review of the repository and its recorded GitHub workflow history. This document is not a claim that production has been tested.

## Executive decision

Do not add customer-facing features yet. First establish a reproducible, testable and supportable baseline. The current code is useful as a first Sticker Balance workflow, but repository evidence alone cannot prove that the live site, Supabase schema, permissions, customer links or deployment are healthy.

## What is confirmed in the repository

- The main branch's latest inspected commit is `03941247875c4280b780c28112cfbb9160f7556d`, dated 29 September 2026.
- The Sticker Balance page is a React page that connects directly to Supabase through the browser client.
- The wider storefront is also documented as an Express/Vite application using JSON files for several existing business records. These are separate persistence paths; the presence of Supabase in the frontend does not mean the whole storefront has migrated to Supabase.
- A Supabase migration exists for the newer Business Book system, but no dedicated Sticker Balance migration was found in `supabase/migrations` during this repository review.
- CI runs `npm ci`, `npm run build`, and `npm test`. This proves only that those checks pass when the workflow completes; it does not prove production deployment or end-to-end behavior.
- The repository has a Hostinger deployment workflow that expects GitHub secrets and a server-side `scripts/deploy.sh`. The latest inspected deployment run (29 September 2026) failed before connecting because `HOSTINGER_HOST` was empty; the log also showed empty username, SSH key and app path. CI passed, but deploy did not reach the server. The secrets must be configured by an authorized repository owner; I cannot retrieve or create those secret values from code.
- Existing architecture documents refer to a separate upstream repository, `martinsobioha/sleekblue_website`. Therefore, this fork's `main` branch must not be treated as the live production source without confirmation from the site owner/operator.

## High-priority risks and gaps

### 1. Production state is unverified
**Risk:** Code merged into this repository may not be the code currently served to customers.  
**Safe response:** Keep production status explicitly marked unknown until an authorized operator confirms the deployment source, successful deployment, live health response and real customer workflow.

### 2. Sticker Balance database setup is not reproducible from this repository
**Risk:** The app's tables, views, policies and RPC functions were previously configured directly in Supabase, while no dedicated versioned Sticker Balance migration was found. A future environment or recovery may not be rebuildable from Git.  
**Safe response:** Do not write or run a guessed migration against the live database. First export/inspect the actual live schema and compare it with the application RPC calls and policies. Then create a reviewed baseline/migration plan and test it against a disposable project or schema.

### 3. The customer access link is a bearer credential
**Risk:** Anyone holding a link can access the associated customer's portal and submit usage, according to the current design. The page requests a long-lived token (10 years). A forwarded or leaked link could be misused.  
**Safe response:** Before wider rollout, test token revocation, expiry, invalid tokens, cross-customer isolation and repeated/parallel usage. Decide whether the business accepts long-lived links or needs shorter expiry/re-issue procedures. Do not change token policy until the current live behavior and customer impact are verified.

### 4. Core workflow tests are not demonstrated
**Risk:** Build success alone does not verify balance correctness or tenant isolation.  
**Required tests before release:** customer creation; delivery increments; usage decrements; rejection of zero/negative/over-balance usage; parallel usage attempts; expired/revoked token rejection; customer A cannot read or mutate customer B; admin-only operations reject non-admins; repeated delivery/usage does not silently duplicate.

### 5. Test/demo data needs a production inventory
**Risk:** Earlier setup included clearly named demo customers if the tables were empty. Their current presence is unknown.  
**Safe response:** Inventory records and identify them before any deletion. Never remove records merely because they look like test data; confirm ownership and export a backup first.

### 6. The business journey is narrower than the strategic goal
**Current scope:** sticker customer, delivery, remaining balance and usage history.  
**Not yet proven:** enquiry → quote/order → production → delivery confirmation → customer satisfaction → follow-up → repeat order.  
**Safe response:** Measure the current workflow with real users before designing a generalized multi-industry platform.

## Fixes started in this branch

- Clarify in the repository README that the storefront and Sticker Balance use distinct persistence paths.
- Improve the deployment workflow so it checks for required Hostinger secrets before attempting SSH, and reports which secret names are missing without exposing their values.
- Record the evidence, unknowns, and safe verification order here so future work does not mistake assumptions for facts.

## Next steps, in safe order

1. Confirm the actual production repository/deployment source with the site operator.
2. Inspect the live Supabase schema, policies, grants, functions, Auth URL settings and record inventory using authorized access.
3. Compare live database behavior with every RPC/table call in `src/pages/StickerBalancePage.jsx`.
4. Run a non-destructive end-to-end test with a dedicated test customer and a backup/cleanup plan.
5. Create versioned database migrations only after the live schema has been captured and reconciled.
6. Add automated tests for the money/stock-like balance rules and access isolation.
7. Verify the intended deployment pipeline and live health checks.
8. Conduct task-based usability testing with a few real customers and staff before expanding features.

## Release gate

Do not describe Sticker Balance as production-ready until correctness, customer isolation, token revocation, backup/recovery, mobile usability and a real deployed workflow have been demonstrated. This is a risk-control decision, not a recommendation to rebuild the entire system.
