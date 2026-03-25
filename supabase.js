import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'NEXT_PUBLIC_SUPABASE_URL=https://jutkxuovgrccbzfmuqbc.supabase.co';
const SUPABASE_KEY = 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_Xwq-_7fBllRJEigi9eydlg_2qJ7R4lf';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);