-- Migration to introduce Product Groups (BOM - Back Office Model)

-- 1. Create product_groups table
create table if not exists product_groups (
    id uuid default uuid_generate_v4() primary key,
    signature text not null unique, -- Hash of grouping content
    
    -- Grouping Fields
    model_code text not null,
    color_code text not null,
    upholstery_code text not null,
    option_codes text[] not null default '{}',
    production_year int, -- Extracted from prod_date or model year
    
    -- Shared Content
    images jsonb[] default array[]::jsonb[],
    description text,
    
    -- Pricing Overrides (if set here, applies to all unless VIN specific overrides exist)
    manual_price numeric,
    
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add FK to stock_units
do $$
begin
    if not exists (select 1 from information_schema.columns where table_name = 'stock_units' and column_name = 'product_group_id') then
        alter table stock_units add column product_group_id uuid references product_groups(id);
    end if;
end $$;

-- 3. Indexes
create index if not exists idx_product_groups_signature on product_groups(signature);
create index if not exists idx_stock_units_group_id on stock_units(product_group_id);

-- 4. Enable RLS
alter table product_groups enable row level security;

create policy "Public can view product groups"
  on product_groups for select
  using (true);

create policy "Admins have full access to groups"
  on product_groups for all
  using (true);
