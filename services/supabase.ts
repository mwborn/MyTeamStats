import { createClient } from '@supabase/supabase-js';

// !! ATTENZIONE !!
// Sostituisci i valori segnaposto qui sotto con le tue credenziali Supabase.
// Puoi trovarle nella dashboard del tuo progetto > Project Settings > API.

const supabaseUrl = 'https://ugdjeiaohbfmiftawfvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZGplaWFvaGJmbWlmdGF3ZnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjg0NTAsImV4cCI6MjA4MjUwNDQ1MH0.5lacm7oTAo3S3o_GZY2q4r798R4vx32pknESzBjYv_8';

if (!supabaseUrl || supabaseUrl.includes('INSERISCI')) {
  throw new Error("Supabase URL is not configured. Please edit services/supabase.ts");
}

if (!supabaseAnonKey || supabaseAnonKey.includes('INSERISCI')) {
  throw new Error("Supabase Anon Key is not configured. Please edit services/supabase.ts");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
