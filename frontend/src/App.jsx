import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { MqttProvider } from './context/MqttContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import BottomNav from './components/BottomNav'
import AiChat from './components/AiChat'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Dashboard from './pages/Dashboard'
import Devices from './pages/Devices'
import Sensors from './pages/Sensors'
import Automation from './pages/Automation'
import Camera from './pages/Camera'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import { useDevices } from './hooks/useDevices'
import { useSensors } from './hooks/useSensors'

function ProtectedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { devices } = useDevices()
  const { sensors } = useSensors()

  const toggleSidebar = () => {
    setSidebarOpen(o => !o)
    document.getElementById('sidebar')?.classList.toggle('open')
    document.querySelector('.sidebar-overlay')?.classList.toggle('show')
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
    document.getElementById('sidebar')?.classList.remove('open')
    document.querySelector('.sidebar-overlay')?.classList.remove('show')
  }

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

        <Routes>
          <Route path="/"           element={<Dashboard devices={devices} sensors={sensors} />} />
          <Route path="/devices"    element={<Devices />} />
          <Route path="/sensors"    element={<Sensors />} />
          <Route path="/automation" element={<Automation devices={devices} sensors={sensors} />} />
          <Route path="/camera"     element={<Camera />} />
          <Route path="/analytics"  element={<Analytics />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="*"           element={<Navigate to="/" replace />} />
        </Routes>
      </div>

      <BottomNav />
      <AiChat />
    </div>
  )
}

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-bolt" style={{ fontSize: 32, color: 'var(--primary)', display: 'block', marginBottom: 12 }} />
        <p>Memuat IoTzy...</p>
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

export default function App() {
  const { user, settings, loading } = useAuth()

  if (loading) return null

  return (
    <ThemeProvider initialTheme={settings?.theme || 'dark'}>
      <MqttProvider settings={settings}>
        <Routes>
          <Route path="/login"    element={user ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <Register />} />
          <Route path="/*" element={
            <RequireAuth>
              <ProtectedLayout />
            </RequireAuth>
          } />
        </Routes>
      </MqttProvider>
    </ThemeProvider>
  )
}
