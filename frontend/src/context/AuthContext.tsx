import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearSession, loginRequest, readSessionUser, saveSession } from '../services/api'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readSessionUser<User>())

  useEffect(() => {
    const clear = () => setUser(null)
    window.addEventListener('auth:expired', clear)
    return () => window.removeEventListener('auth:expired', clear)
  }, [])

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password)
    saveSession(data.access, data.refresh, data.user)
    setUser(data.user)
  }

  async function logout() {
    const refresh = localStorage.getItem('khanayab.refresh')
    try {
      if (refresh) await api.post('auth/logout/', { refresh })
    } finally {
      clearSession()
      setUser(null)
    }
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used within AuthProvider')
  return value
}