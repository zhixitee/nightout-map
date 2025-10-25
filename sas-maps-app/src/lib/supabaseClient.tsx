import { createClient } from '@supabase/supabase-js';

// Read the Next.js-specific environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check that the variables are not missing
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Anon Key from .env.local");
}

// Export the initialized client
export const supabase = createClient(supabaseUrl, supabaseKey);
