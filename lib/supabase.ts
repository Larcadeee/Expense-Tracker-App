
import { createClient } from '@supabase/supabase-js';

// Using the provided Supabase credentials to ensure the app displays correctly.
const supabaseUrl = process.env.SUPABASE_URL || 'https://izrmwlqkejbrhwttlcyd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cm13bHFrZWpicmh3dHRsY3lkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTU4OTEsImV4cCI6MjA4Mzg5MTg5MX0.u2TAfrh4NUeiLzd_oBNKmAdt5DCnmTGlMkLUvYZ_7kE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to check if the app has the actual credentials needed to function.
// Since we have provided defaults, this will now return true.
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));
