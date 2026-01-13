
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables in browser/Vite/Vercel environments
const getEnv = (key: string) => {
  try {
    // Check for standard process.env (Node/Webpack/Vercel default)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    // Check for Vite-style import.meta.env
    if (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env[key]) {
      return (import.meta as any).env[key];
    }
  } catch (e) {
    console.warn(`Environment variable ${key} not found or inaccessible.`);
  }
  return undefined;
};

const supabaseUrl = getEnv('SUPABASE_URL') || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if the app has valid credentials
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
