
import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) return process.env[name] as string;
  if (typeof window !== 'undefined' && (window as any).process?.env?.[name]) return (window as any).process.env[name];
  return '';
};

// These fallbacks are for demonstration; in a real Vercel deploy, these should be set in Project Settings
const supabaseUrl = getEnvVar('SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// A configuration is valid if it's not empty and not the default placeholder text
export const isSupabaseConfigured = supabaseUrl.length > 0 && 
                                   supabaseAnonKey.length > 0 && 
                                   !supabaseUrl.includes('placeholder');
