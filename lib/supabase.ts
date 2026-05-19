import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please check your .env file.');
}

/**
 * Browser / Client Component client.
 * Uses the public anon key — safe to expose in the browser.
 * Import this in "use client" components and client-side hooks.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server Component / Route Handler client.
 * Same anon key but created fresh per import so it is never shared
 * across concurrent server requests (avoids session cross-contamination).
 * Import this in Server Components, generateMetadata, and Route Handlers.
 */
export function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}
