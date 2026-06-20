-- Khumbuka V1.5 Profitability Intelligence Schema
-- Run this in Supabase SQL Editor before using the upgraded app.
create extension if not exists pgcrypto;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text,
  description text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  name text not null,
  location text,
  address text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  purchase_price numeric(12,4) default 0,
  purchase_unit text,
  wastage_percent numeric(8,4) default 0,
  effective_cost numeric(12,6) default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text check (category in ('Filling','Dough','Chutney','Sauce','Masala','Marinade','Beverage','Dessert','Other')) default 'Other',
  yield_quantity numeric(12,4) default 0,
  yield_unit text,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id) on delete restrict,
  quantity numeric(12,4) default 0,
  unit text,
  waste_percent numeric(8,4) default 0,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  name text not null,
  category text,
  packaging_cost numeric(12,4) default 0,
  manual_product_cost numeric(12,4),
  product_cost numeric(12,4),
  offline_price numeric(12,4) default 0,
  online_price numeric(12,4) default 0,
  commission_percent numeric(8,4) default 35,
  offline_profit numeric(12,4),
  online_profit numeric(12,4),
  offline_margin numeric(8,4),
  online_margin numeric(8,4),
  active boolean default true,
  source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists product_recipes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  recipe_id uuid references recipes(id) on delete restrict,
  quantity_used numeric(12,4) default 0,
  unit text,
  created_at timestamptz default now()
);

create table if not exists sales_imports (
  id uuid primary key default gen_random_uuid(),
  source text default 'Petpooja',
  file_name text,
  imported_by text,
  imported_at timestamptz default now()
);

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  sale_date date,
  brand_id uuid references brands(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  product_id uuid references products(id) on delete set null,
  quantity numeric(12,4) default 0,
  gross_revenue numeric(12,4) default 0,
  discount numeric(12,4) default 0,
  net_revenue numeric(12,4) default 0,
  food_cost numeric(12,4) default 0,
  packaging_cost numeric(12,4) default 0,
  commission numeric(12,4) default 0,
  profit numeric(12,4) default 0,
  margin numeric(8,4) default 0,
  created_at timestamptz default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date,
  brand_id uuid references brands(id) on delete set null,
  branch_id uuid references branches(id) on delete set null,
  category text check (category in ('Raw Material','Packaging','Salary','Utilities','Marketing','Transport','Rent','Miscellaneous')) default 'Miscellaneous',
  description text,
  amount numeric(12,4) default 0,
  notes text,
  created_at timestamptz default now()
);

-- Future authentication/permission-ready tables. Not used in V1.5 UI yet.
create table if not exists app_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  role_id uuid references app_roles(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  branch_id uuid references branches(id) on delete cascade,
  created_at timestamptz default now()
);

insert into app_roles(name,description) values
('Admin','Full access'),
('Operations Manager','Sales, expenses and reports; costing can be restricted later'),
('Purchase Staff','Ingredients and expenses only'),
('Branch Manager','Own branch only')
on conflict (name) do nothing;

insert into brands(name,active) values ('Khumbuka', true) on conflict (name) do nothing;
insert into branches(brand_id,name,location,active)
select id,'Main Branch','Default',true from brands where name='Khumbuka'
and not exists (select 1 from branches where name='Main Branch');
