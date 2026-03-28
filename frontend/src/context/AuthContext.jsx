import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiCall } from '../lib/api'

const AuthContext = createContext(null)

const PUBLIC_PATHS = ['/login', '/register']

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

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
    // Jangan fetch di halaman login/register karena belum ada session
    const isPublic = PUBLIC_PATHS.includes(window.location.pathname)
    if (isPublic) {
      setLoading(false)
      return
    }
    Promise.all([fetchUser(), fetchSettings()]).finally(() => setLoading(false))
  }, [fetchUser, fetchSettings])

  const login = async (username, password) => {
    const res = await apiCall('login', { username, password })
    if (res?.success) {
      if (res.csrf_token) sessionStorage.setItem('csrf_token', res.csrf_token)
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

  const refreshSettings = () => fetchSettings()

  return (
    <AuthContext.Provider value={{ user, settings, loading, login, logout, refreshSettings }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)