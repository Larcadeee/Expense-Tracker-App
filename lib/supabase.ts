
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  try {
    // Standard process.env access using bracket notation to avoid naive replacement bugs
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any)[key];
    }
  } catch (e) {}
  
  try {
    // Support for Vite-style import.meta.env
    const meta = (import.meta as any);
    if (meta && meta.env) {
      return meta.env[key];
    }
  } catch (e) {}

  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
