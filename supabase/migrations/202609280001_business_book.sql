-- Sleekblue Business Book: client accounts, activity history, and sticker supply.
-- Apply once in the Supabase SQL Editor for the project configured in src/lib/supabase.js.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.business_clients (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  business_name text not null check (length(btrim(business_name)) between 1 and 120),
  contact_name text not null check (length(btrim(contact_name)) between 1 and 100),
  phone text not null check (length(btrim(phone)) between 7 and 24),
  business_phone text check (business_phone is null or length(btrim(business_phone)) between 7 and 24),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.business_client_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete restrict,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create table public.business_client_login_attempts (
  client_id uuid primary key references public.business_clients(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);

create table public.business_products (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete restrict,
  name text not null check (length(btrim(name)) between 1 and 100),
  unit text not null default 'item' check (length(btrim(unit)) between 1 and 24),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  stock_qty numeric(14,2) not null default 0 check (stock_qty >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index business_products_client_name_uq
  on public.business_products (client_id, lower(name));

create table public.business_transactions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete restrict,
  product_id uuid references public.business_products(id) on delete set null,
  product_name text not null,
  unit text not null,
  kind text not null check (kind in ('sale', 'production', 'adjustment', 'sticker_used', 'sticker_delivery')),
  quantity_delta numeric(14,2) not null check (quantity_delta <> 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now()
);

create index business_transactions_client_date_idx
  on public.business_transactions (client_id, created_at desc, id desc);

create table public.business_sticker_stock (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete restrict,
  product_name text not null check (length(btrim(product_name)) between 1 and 120),
  total_received numeric(14,2) not null default 0 check (total_received >= 0),
  remaining_qty numeric(14,2) not null default 0 check (remaining_qty >= 0),
  threshold_qty numeric(14,2) not null default 500 check (threshold_qty >= 0),
  updated_at timestamptz not null default now(),
  unique (client_id, product_name)
);

create table public.business_sticker_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.business_clients(id) on delete restrict,
  product_name text not null check (length(btrim(product_name)) between 1 and 120),
  quantity numeric(14,2) not null check (quantity > 0),
  threshold_qty numeric(14,2) not null default 500 check (threshold_qty >= 0),
  status text not null default 'printing'
    check (status in ('printing', 'ready', 'waiting_pickup', 'delivered')),
  note text not null default '' check (length(note) <= 500),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index business_sticker_jobs_client_date_idx
  on public.business_sticker_jobs (client_id, created_at desc);

create or replace function public.business_normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  with digits as (
    select regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g') as value
  )
  select case when value like '0%' then '234' || substr(value, 2) else value end
  from digits;
$$;

create or replace function public.business_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.business_client_id_for_session(p_session_token text)
returns uuid
language sql
stable
security definer
set search_path = public, extensions, pg_temp
as $$
  select s.client_id
  from public.business_client_sessions s
  join public.business_clients c on c.id = s.client_id and c.active
  where s.token_hash = encode(digest(convert_to(coalesce(p_session_token, ''), 'UTF8'), 'sha256'), 'hex')
    and s.revoked_at is null
    and s.expires_at > now()
  limit 1;
$$;

alter table public.business_clients enable row level security;
alter table public.business_client_sessions enable row level security;
alter table public.business_client_login_attempts enable row level security;
alter table public.business_products enable row level security;
alter table public.business_transactions enable row level security;
alter table public.business_sticker_stock enable row level security;
alter table public.business_sticker_jobs enable row level security;

create policy business_clients_admin_read on public.business_clients
  for select to authenticated using (public.business_is_admin());
create policy business_products_admin_read on public.business_products
  for select to authenticated using (public.business_is_admin());
create policy business_transactions_admin_read on public.business_transactions
  for select to authenticated using (public.business_is_admin());
create policy business_sticker_stock_admin_read on public.business_sticker_stock
  for select to authenticated using (public.business_is_admin());
create policy business_sticker_jobs_admin_read on public.business_sticker_jobs
  for select to authenticated using (public.business_is_admin());
grant execute on function public.business_is_admin() to authenticated;

grant select on public.business_clients, public.business_products,
  public.business_transactions, public.business_sticker_stock,
  public.business_sticker_jobs to authenticated;
revoke all on public.business_client_sessions, public.business_client_login_attempts from anon, authenticated;
revoke insert, update, delete on public.business_clients, public.business_products,
  public.business_transactions, public.business_sticker_stock,
  public.business_sticker_jobs from anon, authenticated;

create or replace function public.business_admin_create_client(
  p_business_name text,
  p_business_phone text,
  p_contact_name text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_phone text;
  normalized_business_phone text;
  base_slug text;
  client_row public.business_clients%rowtype;
begin
  if not public.business_is_admin() then
    raise exception 'Administrator access required';
  end if;
  normalized_phone := public.business_normalize_phone(p_phone);
  normalized_business_phone := nullif(public.business_normalize_phone(p_business_phone), '');
  if length(normalized_phone) < 8 or length(normalized_phone) > 15 then
    raise exception 'Enter a valid phone number';
  end if;
  if normalized_business_phone is not null
     and length(normalized_business_phone) not between 8 and 15 then
    raise exception 'Enter a valid business phone number';
  end if;
  if length(btrim(coalesce(p_business_name, ''))) not between 1 and 120
     or length(btrim(coalesce(p_contact_name, ''))) not between 1 and 100 then
    raise exception 'Business and contact names are required';
  end if;

  base_slug := trim(both '-' from regexp_replace(lower(btrim(p_business_name)), '[^a-z0-9]+', '-', 'g'));
  if base_slug = '' then base_slug := 'business'; end if;
  base_slug := left(base_slug, 35) || '-' || left(replace(gen_random_uuid()::text, '-', ''), 10);

  insert into public.business_clients (slug, business_name, contact_name, phone, business_phone)
  values (base_slug, btrim(p_business_name), btrim(p_contact_name), normalized_phone, normalized_business_phone)
  returning * into client_row;

  return jsonb_build_object('id', client_row.id, 'slug', client_row.slug, 'business_name', client_row.business_name);
end;
$$;

create or replace function public.business_client_login(p_slug text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  client_row public.business_clients%rowtype;
  normalized_phone text;
  attempt_count integer;
  raw_token text;
begin
  select * into client_row
  from public.business_clients
  where slug = p_slug and active;
  if not found then return jsonb_build_object('ok', false); end if;

  insert into public.business_client_login_attempts as current_attempts (client_id, window_started_at, attempts)
  values (client_row.id, now(), 1)
  on conflict (client_id) do update
    set attempts = case
          when current_attempts.window_started_at < now() - interval '15 minutes' then 1
          else current_attempts.attempts + 1
        end,
        window_started_at = case
          when current_attempts.window_started_at < now() - interval '15 minutes' then now()
          else current_attempts.window_started_at
        end
  returning attempts into attempt_count;

  if attempt_count > 20 then return jsonb_build_object('ok', false, 'rate_limited', true); end if;
  normalized_phone := public.business_normalize_phone(p_phone);
  if normalized_phone <> public.business_normalize_phone(client_row.phone) then
    return jsonb_build_object('ok', false);
  end if;

  raw_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  insert into public.business_client_sessions (client_id, token_hash, expires_at)
  values (
    client_row.id,
    encode(digest(convert_to(raw_token, 'UTF8'), 'sha256'), 'hex'),
    now() + interval '15 years'
  );
  update public.business_client_login_attempts set attempts = 0, window_started_at = now()
    where client_id = client_row.id;
  return jsonb_build_object('ok', true, 'session_token', raw_token);
end;
$$;

create or replace function public.business_add_product(
  p_session_token text,
  p_name text,
  p_unit text default 'item',
  p_unit_price numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  client_key uuid := public.business_client_id_for_session(p_session_token);
  product_key uuid;
begin
  if client_key is null then raise exception 'Session expired'; end if;
  if length(btrim(coalesce(p_name, ''))) not between 1 and 100
     or length(btrim(coalesce(p_unit, ''))) not between 1 and 24
     or coalesce(p_unit_price, -1) < 0 then
    raise exception 'Enter valid product details';
  end if;
  insert into public.business_products (client_id, name, unit, unit_price)
  values (client_key, btrim(p_name), btrim(p_unit), p_unit_price)
  returning id into product_key;
  return product_key;
end;
$$;

create or replace function public.business_record_transaction(
  p_session_token text,
  p_product_id uuid,
  p_kind text,
  p_quantity numeric,
  p_unit_price numeric default 0,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  client_key uuid := public.business_client_id_for_session(p_session_token);
  product_row public.business_products%rowtype;
  quantity_delta_value numeric(14,2);
  transaction_key uuid;
begin
  if client_key is null then raise exception 'Session expired'; end if;
  if p_kind not in ('sale', 'production', 'adjustment')
     or coalesce(p_quantity, 0) <= 0 or coalesce(p_quantity, 0) > 1000000000
     or coalesce(p_unit_price, -1) < 0
     or length(coalesce(p_note, '')) > 500 then
    raise exception 'Enter valid activity details';
  end if;

  select * into product_row from public.business_products
  where id = p_product_id and client_id = client_key and active for update;
  if not found then raise exception 'Product not found'; end if;

  if p_kind = 'sale' then
    update public.business_products
      set stock_qty = stock_qty - p_quantity
      where id = product_row.id and stock_qty >= p_quantity;
    if not found then raise exception 'Insufficient stock'; end if;
    quantity_delta_value := -p_quantity;
  else
    update public.business_products set stock_qty = stock_qty + p_quantity where id = product_row.id;
    quantity_delta_value := p_quantity;
  end if;

  insert into public.business_transactions (
    client_id, product_id, product_name, unit, kind, quantity_delta,
    unit_price, total_amount, note
  ) values (
    client_key, product_row.id, product_row.name, product_row.unit, p_kind,
    quantity_delta_value,
    case when p_kind = 'sale' then p_unit_price else 0 end,
    case when p_kind = 'sale' then p_quantity * p_unit_price else 0 end,
    btrim(coalesce(p_note, ''))
  ) returning id into transaction_key;
  return transaction_key;
end;
$$;

create or replace function public.business_consume_stickers(
  p_session_token text,
  p_sticker_id uuid,
  p_quantity numeric
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  client_key uuid := public.business_client_id_for_session(p_session_token);
  stock_row public.business_sticker_stock%rowtype;
  transaction_key uuid;
begin
  if client_key is null then raise exception 'Session expired'; end if;
  if coalesce(p_quantity, 0) <= 0 or coalesce(p_quantity, 0) > 1000000000 then
    raise exception 'Enter a valid sticker quantity';
  end if;
  select * into stock_row from public.business_sticker_stock
    where id = p_sticker_id and client_id = client_key for update;
  if not found then raise exception 'Sticker product not found'; end if;
  update public.business_sticker_stock
    set remaining_qty = remaining_qty - p_quantity, updated_at = now()
    where id = stock_row.id and remaining_qty >= p_quantity;
  if not found then raise exception 'Insufficient sticker stock'; end if;
  insert into public.business_transactions (
    client_id, product_name, unit, kind, quantity_delta, total_amount, note
  ) values (
    client_key, stock_row.product_name, 'stickers', 'sticker_used', -p_quantity, 0, 'Client recorded sticker use'
  ) returning id into transaction_key;
  return transaction_key;
end;
$$;

create or replace function public.business_admin_create_sticker_job(
  p_client_id uuid,
  p_product_name text,
  p_quantity numeric,
  p_threshold_qty numeric default 500,
  p_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job_key uuid;
begin
  if not public.business_is_admin() then raise exception 'Administrator access required'; end if;
  if not exists (select 1 from public.business_clients where id = p_client_id and active) then
    raise exception 'Client not found';
  end if;
  if length(btrim(coalesce(p_product_name, ''))) not between 1 and 120
     or coalesce(p_quantity, 0) <= 0 or coalesce(p_threshold_qty, -1) < 0
     or length(coalesce(p_note, '')) > 500 then
    raise exception 'Enter valid sticker job details';
  end if;
  insert into public.business_sticker_jobs (client_id, product_name, quantity, threshold_qty, note)
  values (p_client_id, btrim(p_product_name), p_quantity, p_threshold_qty, btrim(coalesce(p_note, '')))
  returning id into job_key;
  return job_key;
end;
$$;

create or replace function public.business_admin_update_sticker_job(p_job_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  job_row public.business_sticker_jobs%rowtype;
begin
  if not public.business_is_admin() then raise exception 'Administrator access required'; end if;
  if p_status not in ('printing', 'ready', 'waiting_pickup', 'delivered') then
    raise exception 'Invalid sticker job status';
  end if;
  select * into job_row from public.business_sticker_jobs where id = p_job_id for update;
  if not found then raise exception 'Sticker job not found'; end if;
  if job_row.status = 'delivered' and p_status <> 'delivered' then
    raise exception 'Delivered jobs cannot be reopened';
  end if;

  update public.business_sticker_jobs
  set status = p_status,
      delivered_at = case when p_status = 'delivered' then coalesce(delivered_at, now()) else delivered_at end
  where id = p_job_id;

  if job_row.status <> 'delivered' and p_status = 'delivered' then
    insert into public.business_sticker_stock as existing_stock (
      client_id, product_name, total_received, remaining_qty, threshold_qty, updated_at
    ) values (
      job_row.client_id, job_row.product_name, job_row.quantity, job_row.quantity,
      job_row.threshold_qty, now()
    ) on conflict (client_id, product_name) do update
        set total_received = existing_stock.total_received + excluded.total_received,
          remaining_qty = existing_stock.remaining_qty + excluded.remaining_qty,
          threshold_qty = excluded.threshold_qty,
          updated_at = now();

    insert into public.business_transactions (
      client_id, product_name, unit, kind, quantity_delta, total_amount, note
    ) values (
      job_row.client_id, job_row.product_name, 'stickers', 'sticker_delivery', job_row.quantity,
      0, 'Sticker supply delivered'
    );
  end if;
end;
$$;

create or replace function public.business_admin_client_summary(p_client_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  result jsonb;
begin
  if not public.business_is_admin() then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'sales_total', coalesce(sum(t.total_amount) filter (where t.kind = 'sale'), 0),
    'transaction_count', count(t.id),
    'first_transaction_at', min(t.created_at)
  ) into result
  from public.business_transactions t
  where t.client_id = p_client_id;
  return result;
end;
$$;

create or replace function public.business_portal_snapshot(p_session_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  client_key uuid := public.business_client_id_for_session(p_session_token);
  result jsonb;
begin
  if client_key is null then return jsonb_build_object('client', null); end if;
  select jsonb_build_object(
    'client', (select jsonb_build_object('id', c.id, 'business_name', c.business_name, 'contact_name', c.contact_name)
      from public.business_clients c where c.id = client_key),
    'products', coalesce((select jsonb_agg(jsonb_build_object(
      'id', p.id, 'name', p.name, 'unit', p.unit, 'unit_price', p.unit_price, 'stock_qty', p.stock_qty
    ) order by p.name) from public.business_products p where p.client_id = client_key and p.active), '[]'::jsonb),
    'transactions', coalesce((select jsonb_agg(to_jsonb(t) order by t.created_at desc, t.id desc)
      from (select id, product_name, unit, kind, quantity_delta, unit_price, total_amount, note, created_at
        from public.business_transactions where client_id = client_key
        order by created_at desc, id desc limit 100) t), '[]'::jsonb),
    'has_more_transactions', (select count(*) > 100 from public.business_transactions where client_id = client_key),
    'stickers', coalesce((select jsonb_agg(jsonb_build_object(
      'id', s.id, 'product_name', s.product_name, 'remaining_qty', s.remaining_qty, 'threshold_qty', s.threshold_qty
    ) order by s.product_name) from public.business_sticker_stock s where s.client_id = client_key), '[]'::jsonb),
    'jobs', coalesce((select jsonb_agg(to_jsonb(j) order by j.created_at desc)
      from (select id, product_name, quantity, status, note, created_at
        from public.business_sticker_jobs where client_id = client_key
        order by created_at desc limit 100) j), '[]'::jsonb),
    'stats', jsonb_build_object(
      'sales_total', coalesce((select sum(t.total_amount) from public.business_transactions t
        where t.client_id = client_key and t.kind = 'sale'), 0),
      'first_transaction_at', (select min(t.created_at) from public.business_transactions t
        where t.client_id = client_key)
    )
  ) into result;
  return result;
end;
$$;

create or replace function public.business_transaction_page(
  p_session_token text,
  p_offset integer default 0,
  p_year integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  client_key uuid := public.business_client_id_for_session(p_session_token);
  rows jsonb;
begin
  if client_key is null then raise exception 'Session expired'; end if;
  if coalesce(p_offset, -1) < 0 or p_offset > 10000000 then raise exception 'Invalid history page'; end if;
  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at desc, t.id desc), '[]'::jsonb)
    into rows
  from (
    select id, product_name, unit, kind, quantity_delta, unit_price, total_amount, note, created_at
    from public.business_transactions
    where client_id = client_key
      and (p_year is null or extract(year from created_at at time zone 'Africa/Lagos')::integer = p_year)
    order by created_at desc, id desc offset p_offset limit 100
  ) t;
  return rows;
end;
$$;

revoke all on function public.business_normalize_phone(text) from public;
revoke all on function public.business_is_admin() from public;
revoke all on function public.business_client_id_for_session(text) from public;
revoke all on function public.business_admin_create_client(text, text, text, text) from public;
revoke all on function public.business_client_login(text, text) from public;
revoke all on function public.business_add_product(text, text, text, numeric) from public;
revoke all on function public.business_record_transaction(text, uuid, text, numeric, numeric, text) from public;
revoke all on function public.business_consume_stickers(text, uuid, numeric) from public;
revoke all on function public.business_admin_create_sticker_job(uuid, text, numeric, numeric, text) from public;
revoke all on function public.business_admin_update_sticker_job(uuid, text) from public;
revoke all on function public.business_admin_client_summary(uuid) from public;
revoke all on function public.business_portal_snapshot(text) from public;
revoke all on function public.business_transaction_page(text, integer, integer) from public;

grant execute on function public.business_admin_create_client(text, text, text, text) to authenticated;
grant execute on function public.business_client_login(text, text) to anon, authenticated;
grant execute on function public.business_add_product(text, text, text, numeric) to anon, authenticated;
grant execute on function public.business_record_transaction(text, uuid, text, numeric, numeric, text) to anon, authenticated;
grant execute on function public.business_consume_stickers(text, uuid, numeric) to anon, authenticated;
grant execute on function public.business_admin_create_sticker_job(uuid, text, numeric, numeric, text) to authenticated;
grant execute on function public.business_admin_update_sticker_job(uuid, text) to authenticated;
grant execute on function public.business_admin_client_summary(uuid) to authenticated;
grant execute on function public.business_portal_snapshot(text) to anon, authenticated;
grant execute on function public.business_transaction_page(text, integer, integer) to anon, authenticated;

notify pgrst, 'reload schema';