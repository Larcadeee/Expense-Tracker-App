
import { createClient } from '@supabase/supabase-js';

// Robust environment variable access
const getEnvVar = (name: string): string => {
  // Try various common locations for environment variables in browser/bundler environments
  const val = (typeof process !== 'undefined' && process.env ? process.env[name] : undefined) ||
              (typeof window !== 'undefined' && (window as any).process?.env?.[name]) ||
              ((import.meta as any).env?.[name]);
  
  return val || '';
};

const supabaseUrl = getEnvVar('SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
