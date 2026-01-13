
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string | undefined => {
  try {
    // Check global scope for process object safely using globalThis to fix the 'global' name error.
    const g = (typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : {}) as any;
    if (g.process && g.process.env) {
      return g.process.env[key];
    }
  } catch (e) {}
  
  try {
    // Fallback to import.meta.env for Vite/modern bundlers
    const metaEnv = (import.meta as any).env;
    if (metaEnv) {
      return metaEnv[key];
    }
  } catch (e) {}

  return undefined;
};

// These fallbacks allow the app to run even if env vars are temporarily missing during build
const supabaseUrl = getEnv('SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Guard to prevent mounting if config is explicitly invalid or placeholder
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
