import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { User } from '@supabase/supabase-js'

// Cliente para uso en componentes del cliente
export const supabase = createClient()

// Función para obtener el usuario actual en el servidor
export async function getUser(): Promise<User | null> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Función para hacer login con email y password
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Función para hacer signup con email y password
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

// Función para hacer logout
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Función para verificar si el usuario está autenticado
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser()
  return !!user
}