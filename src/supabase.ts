import { createClient } from '@supabase/supabase-js'

// Se conecta con el archivo .env (Para referencias .env.example)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se agrega para comprobar errores en el despliegue de Netlify
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de entorno de Supabase");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)