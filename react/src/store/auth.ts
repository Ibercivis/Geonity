import { create } from 'zustand'
import type { User, UserProfile } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  profile: UserProfile | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  setProfile: (profile: UserProfile) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('auth_token'),
  user: null,
  profile: null,

  setToken: (token) => {
    localStorage.setItem('auth_token', token)
    set({ token })
  },

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),

  logout: () => {
    localStorage.removeItem('auth_token')
    set({ token: null, user: null, profile: null })
  },
}))
