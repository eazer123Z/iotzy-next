import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useMqtt } from '../context/MqttContext'

const TITLES = {
  '/':           'Overview',
  '/devices':    'Perangkat',
  '/sensors':    'Sensor',
  '/automation': 'Rules Engine',
  '/camera':     'Computer Vision',
  '/analytics':  'Log & Analytics',
  '/settings':   'Pengaturan',
}

export default function Topbar({ onToggleSidebar }) {
  const { pathname }    = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { connected }   = useMqtt()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('id-ID'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onToggleSidebar}>
          <i className="fas fa-bars" />
        </button>
        <span className="page-title" id="pageTitle">
          {TITLES[pathname] || 'IoTzy'}
        </span>
      </div>
      <div className="topbar-right">
        <div className="mqtt-status-pill">
          <span className={`mqtt-dot${connected ? ' online' : ''}`} id="mqttStatusDot" />
          <span id="mqttStatusText">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="clock-badge">{clock}</div>
        <button className="icon-btn" onClick={toggleTheme} id="themeToggleBtn" title="Toggle tema">
          <i className={`fas ${theme === 'dark' ? 'fa-moon' : 'fa-sun'}`} />
        </button>
      </div>
    </header>
  )
}
