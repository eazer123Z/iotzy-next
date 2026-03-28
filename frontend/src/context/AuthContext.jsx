import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiCall } from '../lib/api'

const AuthContext = createContext(null)

const PUBLIC_PATHS = ['/login', '/register']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch user + settings sekaligus dalam 1 roundtrip (hemat 1 API call)
  const fetchSession = useCallback(async () => {
    const [userRes, settingsRes] = await Promise.all([
      apiCall('get_user'),
      apiCall('get_settings'),
    ])

    if (userRes?.success && userRes.user) {
      setUser(userRes.user)
      if (userRes.csrf_token) sessionStorage.setItem('csrf_token', userRes.csrf_token)
    } else {
      setUser(null)
    }

    if (settingsRes?.success) {
      setSettings(settingsRes.settings ?? settingsRes)
    }
  }, [])

  const fetchUser = useCallback(async () => {
    const res = await apiCall('get_user')
    if (res?.success && res.user) {
      setUser(res.user)
      if (res.csrf_token) sessionStorage.setItem('csrf_token', res.csrf_token)
    } else {
      setUser(null)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    const res = await apiCall('get_settings')
    if (res?.success) setSettings(res.settings ?? res)
  }, [])

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.includes(window.location.pathname)
    if (isPublic) {
      setLoading(false)
      return
    }
    // Fetch keduanya paralel, set loading false setelah keduanya selesai
    fetchSession().finally(() => setLoading(false))
  }, [fetchSession])

  const login = async (username, password) => {
    const res = await apiCall('login', { username, password })
    if (res?.success) {
      if (res.csrf_token) sessionStorage.setItem('csrf_token', res.csrf_token)
      // Fetch paralel setelah login
      await Promise.all([fetchUser(), fetchSettings()])
    }
    return res
  }

  const logout = async () => {
    await apiCall('logout')
    sessionStorage.clear()
    setUser(null)
    setSettings(null)
  }

  const refreshSettings = useCallback(() => fetchSettings(), [fetchSettings])

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)