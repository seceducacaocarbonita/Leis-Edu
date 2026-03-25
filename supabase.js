import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jutkxuovgrccbzfmuqbc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Xwq-_7fBllRJEigi9eydlg_2qJ7R4lf';

/*
  Estrutura esperada no Supabase (SQL sugerido):

  create table if not exists public.app_settings (
    id text primary key,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );

  create table if not exists public.app_ui_state (
    id text primary key,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
  );

  create table if not exists public.app_categories (
    id text primary key,
    name text not null,
    slug text not null,
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists public.app_documents (
    id text primary key,
    title text not null,
    slug text not null,
    protocol text not null,
    document_type text not null,
    category_id text not null,
    category_name text not null,
    administrative_sphere text not null,
    law_or_document_number text,
    year integer not null,
    issuing_body text not null,
    jurisdiction_state text,
    jurisdiction_city text,
    publication_date date,
    summary text not null,
    full_description text not null,
    keywords jsonb not null default '[]'::jsonb,
    pdf_url text,
    cover_image_data text,
    active boolean not null default true,
    featured boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists public.app_audit_logs (
    id text primary key,
    time timestamptz not null default now(),
    action text not null,
    target_type text not null,
    target_label text not null,
    detail text,
    created_at timestamptz not null default now()
  );

  -- Exemplo mínimo de RLS:
  alter table public.app_settings enable row level security;
  alter table public.app_ui_state enable row level security;
  alter table public.app_categories enable row level security;
  alter table public.app_documents enable row level security;
  alter table public.app_audit_logs enable row level security;

  create policy "public read settings" on public.app_settings for select using (true);
  create policy "public read categories" on public.app_categories for select using (true);
  create policy "public read documents" on public.app_documents for select using (true);

  create policy "auth manage settings" on public.app_settings for all to authenticated using (true) with check (true);
  create policy "auth manage ui_state" on public.app_ui_state for all to authenticated using (true) with check (true);
  create policy "auth manage categories" on public.app_categories for all to authenticated using (true) with check (true);
  create policy "auth manage documents" on public.app_documents for all to authenticated using (true) with check (true);
  create policy "auth manage audit_logs" on public.app_audit_logs for all to authenticated using (true) with check (true);
*/

export const DB_TABLES = {
  settings: 'app_settings',
  ui: 'app_ui_state',
  categories: 'app_categories',
  documents: 'app_documents',
  audit: 'app_audit_logs'
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
