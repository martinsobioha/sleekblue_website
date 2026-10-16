import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sjyclvtbcrgufhijzmim.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_uasWePWh2DdXb78oDxVT0A_XAoprEi8'

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
