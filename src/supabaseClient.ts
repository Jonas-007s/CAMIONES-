import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Evita fallos cuando las variables no están configuradas durante desarrollo.
// Si no hay URL o KEY, exporta null y el código llamante usará el backend local.
export const supabase: any = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null