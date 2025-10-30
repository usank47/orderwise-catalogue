-- Supabase schema for OrderFlow
-- Run this in Supabase SQL editor to create tables and basic policies for development.
-- NOTE: These policies are permissive for development. For production, enable Supabase Auth and tighten RLS policies.

-- orders table (top-level order metadata)
create table if not exists public.orders (
  id text primary key,
  date date,
  supplier text,
  total_amount numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- products table (order items)
create table if not exists public.order_products (
  id text primary key,
  order_id text references public.orders(id) on delete cascade,
  name text,
  quantity int,
  price numeric,
  category text,
  brand text,
  compatibility text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- indexes for efficient sync queries
create index if not exists idx_orders_updated_at on public.orders (updated_at);
create index if not exists idx_order_products_updated_at on public.order_products (updated_at);

-- Enable Row Level Security (RLS)
alter table public.orders enable row level security;
alter table public.order_products enable row level security;

-- Development policies (allow public reads and writes). Replace or tighten these for production.
create policy public_orders_dev_policy on public.orders
  for all
  using (true)
  with check (true);

create policy public_order_products_dev_policy on public.order_products
  for all
  using (true)
  with check (true);

-- Optional: Example function to upsert order with products in a single transaction
-- You can call this from server-side code if you need atomic upserts.

create or replace function public.upsert_order_with_products(
  p_order_id text,
  p_date date,
  p_supplier text,
  p_total_amount numeric,
  p_products jsonb -- array of product objects
) returns void language plpgsql as $$
begin
  -- upsert order
  insert into public.orders (id, date, supplier, total_amount, created_at, updated_at)
  values (p_order_id, p_date, p_supplier, p_total_amount, now(), now())
  on conflict (id) do update set
    date = excluded.date,
    supplier = excluded.supplier,
    total_amount = excluded.total_amount,
    updated_at = now();

  -- upsert products
  if p_products is not null then
    for prod in select * from jsonb_to_recordset(p_products) as (id text, name text, quantity int, price numeric, category text, brand text, compatibility text) loop
      insert into public.order_products (id, order_id, name, quantity, price, category, brand, compatibility, created_at, updated_at)
      values (prod.id, p_order_id, prod.name, prod.quantity, prod.price, prod.category, prod.brand, prod.compatibility, now(), now())
      on conflict (id) do update set
        name = excluded.name,
        quantity = excluded.quantity,
        price = excluded.price,
        category = excluded.category,
        brand = excluded.brand,
        compatibility = excluded.compatibility,
        updated_at = now();
    end loop;
  end if;
end;
$$;
