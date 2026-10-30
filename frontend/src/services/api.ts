import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { LoginResponse, User } from '../types'

const baseURL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '') + '/'
const ACCESS_KEY = 'khanayab.access'
const REFRESH_KEY = 'khanayab.refresh'
const USER_KEY = 'khanayab.user'

export const api = axios.create({
  baseURL,
  headers: { Accept: 'application/json' },
})

export function saveSession(access: string, refresh: string, user: User) {
  localStorage.setItem(ACCESS_KEY, access)
  localStorage.setItem(REFRESH_KEY, refresh)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('auth:expired'))
}

export function readSessionUser<T>() {
  const value = localStorage.getItem(USER_KEY)
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  config.headers.set('Accept', 'application/json')
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  } else if (config.data !== undefined) {
    config.headers.set('Content-Type', 'application/json')
  }
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

let refreshRequest: Promise<string> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const refresh = localStorage.getItem(REFRESH_KEY)
    if (error.response?.status !== 401 || !config || config._retry || !refresh) {
      return Promise.reject(error)
    }

    config._retry = true
    refreshRequest ??= axios.post<{ access: string; refresh?: string }>(`${baseURL}auth/token/refresh/`, { refresh })
      .then(({ data }) => {
        localStorage.setItem(ACCESS_KEY, data.access)
        if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh)
        return data.access
      })
      .finally(() => { refreshRequest = null })

    try {
      const access = await refreshRequest
      config.headers.Authorization = `Bearer ${access}`
      return api(config)
    } catch (refreshError) {
      clearSession()
      return Promise.reject(refreshError)
    }
  },
)

export function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>
      if (typeof record.detail === 'string') return record.detail
      if (typeof record.error === 'string') return record.error
      if (typeof record.message === 'string') return record.message
      const first = Object.values(record)[0]
      if (Array.isArray(first)) return first.join(' ')
      if (typeof first === 'string') return first
    }
    if (error.response?.status && error.response.status >= 500) {
      return `خطای داخلی سرور (HTTP ${error.response.status}). جزئیات در پاسخ API موجود نیست.`
    }
    if (typeof data === 'string' && !data.trimStart().startsWith('<')) return data.slice(0, 300)
    if (error.response?.status) return `درخواست با وضعیت HTTP ${error.response.status} رد شد.`
    return `ارتباط با API برقرار نشد: ${error.message}`
  }
  return 'ارتباط با سرور برقرار نشد. دوباره تلاش کنید.'
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<LoginResponse>('auth/login/', { email, password })
  return data
}