# Sleekblue Business Book

The Business Book is a mobile-first client record system attached to this site. Staff onboard a client once and send the same permanent `/business/{slug}` link whenever needed. Clients enter their registered phone number, then record products, production/stock received, and sales. Sales reduce product stock and each entry is timestamped. Staff can review client products, sales totals, historical activity by year, and sticker stock/jobs. Client and staff screens refresh from the shared database every 30 seconds while open.

## One-time setup

1. Sign in to the Supabase project configured in `src/lib/supabase.js` and open **SQL Editor**.
2. Run `supabase/migrations/202609280001_business_book.sql` once.
3. Confirm each staff Supabase Auth user has a matching `profiles` row with `role = 'admin'`. The system intentionally denies staff access if that role is missing.
4. Build and deploy the site. The existing `/portal` navigation includes **Business Book**; its direct staff URL is `/business-admin`.
5. Open **Business Book**, create a client using their name, business name, and login phone number, then copy the generated link. Business phone is optional.

The SQL migration uses the existing `profiles` table and Supabase Auth accounts. Do not put a Supabase service-role key in the frontend. Client data is tenant-scoped through the database RPCs and row-level security. Transaction rows are append-only from the app; there is no client-side delete flow.

If the app reports that `business_admin_create_client` cannot be found in the schema cache after setup, run `NOTIFY pgrst, 'reload schema';` in the SQL Editor, wait briefly, and retry. Confirm the migration completed successfully first.

## Client access and installation

No SMS or one-time code is sent. The permanent client link plus the registered phone number grants account access. This is intentionally low-friction, not identity verification: anyone with both can access that client's business records. Clients can use the same link on additional devices and enter their phone number there.

The app is installable as a PWA where the browser supports installation. The link always works in the browser; iOS requires **Add to Home Screen** in Safari, and Android controls when its install prompt is available. Browsers do not permit a site to silently install itself.

## Data retention

The database stores dated product and sticker activity without an automatic app-level expiry. Supabase project availability is not a 15-year backup guarantee: configure and periodically verify database backups/exports that match the business's retention needs before treating it as an archival system.