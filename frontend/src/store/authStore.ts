/**
 * Estado global de autenticación con Zustand.
 * 
 * Guardamos el perfil del usuario en memoria.
 * La fuente de verdad real es la cookie HttpOnly del backend —
 * si la cookie expira, el interceptor de axios redirige al login.
 */
import { create } from 'zustand'
import api from '../services/api'

interface User {
  user_id: string
  display_name: string
  email: string
  avatar_url: string | null
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  fetchUser: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  fetchUser: async () => {
    try {
      const { data } = await api.get<User>('/auth/me')
      set({ user: data, isAuthenticated: true, isLoading: false })
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false })
    }
  },

  logout: async () => {
    await api.post('/auth/logout')
    set({ user: null, isAuthenticated: false })
    window.location.href = '/'
  },
}))