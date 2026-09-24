import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const portalConfigured = Boolean(SUPABASE_URL && ANON_KEY)

// The anon key is public by design; what an intern can read or write is enforced by row level security.
export const supabase = portalConfigured ? createClient(SUPABASE_URL, ANON_KEY) : null
