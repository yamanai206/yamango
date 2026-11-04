import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.error('⚠️ تحذير: لم يتم العثور على VITE_SUPABASE_URL في ملف .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);