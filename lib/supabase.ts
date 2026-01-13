
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  // Exhaustive check for various environment variable locations
  const val = (typeof process !== 'undefined' && process.env ? process.env[name] : undefined) ||
              (typeof window !== 'undefined' && (window as any).process?.env?.[name]) ||
              ((import.meta as any).env?.[name]) ||
              '';
  return val as string;
};

// Vercel injected variables or fallbacks
const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Configuration is valid if key is present and doesn't look like a placeholder
export const isSupabaseConfigured = !!supabaseUrl && 
                                   !!supabaseAnonKey && 
                                   !supabaseUrl.includes('placeholder') &&
                                   supabaseUrl.startsWith('http');
