import { createClient } from '@supabase/supabase-js';

// Questi valori devono essere configurati nelle variabili d'ambiente del progetto.
const supabaseUrl = process.env.https://ugdjeiaohbfmiftawfvm.supabase.co;
const supabaseAnonKey = process.env.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnZGplaWFvaGJmbWlmdGF3ZnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5Mjg0NTAsImV4cCI6MjA4MjUwNDQ1MH0.5lacm7oTAo3S3o_GZY2q4r798R4vx32pknESzBjYv_8;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
