import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isPremium: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, username: string, password: string) => Promise<void>
  logout: () => void
  updateBalance: (amount: number) => void
}

const PREMIUM_CREDENTIALS = {
  email: 'premium@retruco.com',
  password: 'premium123',
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isPremium: false,

      login: async (email: string, password: string) => {
        const isPremium =
          email === PREMIUM_CREDENTIALS.email &&
          password === PREMIUM_CREDENTIALS.password

        if (isPremium) {
          const premiumUser: User = {
            id: 'premium-user',
            email: PREMIUM_CREDENTIALS.email,
            username: 'Premium',
            balance: 1000,
            createdAt: new Date(),
          }
          set({
            user: premiumUser,
            token: 'premium-token',
            isAuthenticated: true,
            isPremium: true,
          })
          return
        }

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })

        if (!response.ok) throw new Error('Credenciales inválidas')

        const { user, token } = await response.json()
        set({ user, token, isAuthenticated: true, isPremium: false })
      },

      register: async (email: string, username: string, password: string) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, username, password }),
        })

        if (!response.ok) throw new Error('Error al registrarse')

        const { user, token } = await response.json()
        set({ user, token, isAuthenticated: true, isPremium: false })
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, isPremium: false })
      },

      updateBalance: (amount: number) => {
        set((state) => {
          if (!state.user) return state
          return {
            user: { ...state.user, balance: state.user.balance + amount },
          }
        })
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
)
