import { useState, useEffect, lazy, Suspense, useCallback } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { MqttProvider } from './context/MqttContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import BottomNav from './components/BottomNav'
import AiChat from './components/AiChat'
import { useDevices } from './hooks/useDevices'
import { useSensors } from './hooks/useSensors'

// ── Lazy load semua halaman (tidak di-load sebelum dibutuhkan) ──────────────
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Devices = lazy(() => import('./pages/Devices'))
const Sensors = lazy(() => import('./pages/Sensors'))
const Automation = lazy(() => import('./pages/Automation'))
const Camera = lazy(() => import('./pages/Camera'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

// ── Loading spinner (pakai style yang sudah ada di project) ────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <i
          className="fas fa-bolt"
          style={{ fontSize: 28, color: 'var(--primary)', display: 'block', marginBottom: 10 }}
        />
        <p style={{ fontSize: '.85rem' }}>Memuat...</p>
      </div>
    </div>
  )
}

// ── Layout utama setelah login ──────────────────────────────────────────────
function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { devices } = useDevices()
  const { sensors } = useSensors()

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(o => !o)
    document.getElementById('sidebar')?.classList.toggle('open')
    document.querySelector('.sidebar-overlay')?.classList.toggle('show')
  }, [])

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false)
    document.getElementById('sidebar')?.classList.remove('open')
    document.querySelector('.sidebar-overlay')?.classList.remove('show')
  }, [])

  // Preload halaman yang paling sering dibuka setelah layout siap
  useEffect(() => {
    const preloads = [
      () => import('./pages/Dashboard'),
      () => import('./pages/Devices'),
      () => import('./pages/Sensors'),
    ]
    // Tunda preload 2 detik agar tidak rebutan bandwidth saat pertama load
    const timer = setTimeout(() => {
      preloads.forEach(fn => fn().catch(() => { }))
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="app-shell">
      <Sidebar
        deviceCount={devices.length}
        sensorCount={sensors.length}
        onClose={closeSidebar}
      />
      <div className="sidebar-overlay" onClick={closeSidebar} />

      <div className="main-content">
        <Topbar onToggleSidebar={toggleSidebar} />

        {/* Suspense hanya wrap Routes, bukan seluruh layout */}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard devices={devices} sensors={sensors} />} />
            <Route path="/devices" element={<Devices />} />
            <Route path="/sensors" element={<Sensors />} />
            <Route path="/automation" element={<Automation devices={devices} sensors={sensors} />} />
            <Route path="/camera" element={<Camera />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      <BottomNav />
      <AiChat />
    </div>
  )
}

// ── Guard: redirect ke /login jika belum login ─────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <i
          className="fas fa-bolt"
          style={{ fontSize: 32, color: 'var(--primary)', display: 'block', marginBottom: 12 }}
        />
        <p>Memuat IoTzy...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  const { user, settings, loading } = useAuth()

  if (loading) return null

  return (
    <ThemeProvider initialTheme={settings?.theme || 'dark'}>
      <MqttProvider settings={settings}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
            <Route path="/*" element={
              <RequireAuth>
                <ProtectedLayout />
              </RequireAuth>
            } />
          </Routes>
        </Suspense>
      </MqttProvider>
    </ThemeProvider>
  )
}