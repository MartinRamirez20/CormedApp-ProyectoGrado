import { createClient } from '@supabase/supabase-js'

// Se conecta con el archivo .env (Para referencias .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Agrega este console.log temporal para depurar:
console.log("URL:", supabaseUrl); 
console.log("Key:", supabaseAnonKey ? "Cargada (Oculta)" : "No cargada");

export const supabase = createClient(supabaseUrl, supabaseAnonKey)