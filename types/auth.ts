import { User } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  loading: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials extends LoginCredentials {
  confirmPassword?: string
}

export interface AuthError {
  message: string
  code?: string
}