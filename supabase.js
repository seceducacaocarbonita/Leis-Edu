import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://jutkxuovgrccbzfmuqbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dGt4dW92Z3JjY2J6Zm11cWJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzU2OTcsImV4cCI6MjA4OTk1MTY5N30.3QnzLoIiFp6qEMH5KrlvWxNxS_eJjj9h7xhuAtGlpvY';

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

  create table if not exists public.app_institutional_records (
    id text primary key,
    name text not null,
    person_type text not null,
    role text not null,
    department text,
    position text,
    formation text,
    conclusion_date date,
    graduation text,
    specialization text,
    employment_status text,
    vacation_type text,
    license_type text,
    leave_status text,
    leave_document_data text,
    leave_document_name text,
    cpf text not null,
    address text not null,
    phone text,
    email text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );



  create table if not exists public.app_attendance (
    id text primary key,
    month_key text not null,
    person_id text not null,
    school text,
    days jsonb not null default '{}'::jsonb,
    observations text,
    updated_by text,
    updated_at timestamptz not null default now()
  );

  -- Segurança / LGPD:
  -- Não use políticas genéricas como `authenticated using (true)` em produção.
  -- Aplique o arquivo supabase_migration_segura.sql incluído neste pacote e cadastre cada usuário
  -- em public.app_user_profiles com role, escola vinculada e status ativo.

*/

export const DB_TABLES = {
  settings: 'app_settings',
  ui: 'app_ui_state',
  categories: 'app_categories',
  documents: 'app_documents',
  audit: 'app_audit_logs',
  institutional: 'app_institutional_records',
  attendance: 'app_attendance'
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});