import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useMqtt } from '../context/MqttContext'

const NAV = [
  { group: 'Monitor' },
  { to: '/',           icon: 'fa-house',     label: 'Overview' },
  { to: '/devices',    icon: 'fa-microchip', label: 'Perangkat' },
  { to: '/sensors',    icon: 'fa-signal',    label: 'Sensor' },
  { group: 'Automasi' },
  { to: '/automation', icon: 'fa-robot',     label: 'Rules Engine' },
  { to: '/camera',     icon: 'fa-eye',       label: 'Computer Vision' },
  { group: 'Sistem' },
  { to: '/analytics',  icon: 'fa-chart-bar', label: 'Log & Analytic' },
  { to: '/settings',   icon: 'fa-gear',      label: 'Pengaturan' },
]

export default function Sidebar({ deviceCount = 0, sensorCount = 0, onClose }) {
  const { user, logout } = useAuth()
  const { connected, connect } = useMqtt()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo"><i className="fas fa-bolt" /></div>
        <span className="brand-name">IoTzy</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.map((item, i) => {
          if (item.group) return (
            <div key={i} className="nav-group-label" style={{ marginTop: i > 0 ? 18 : 0 }}>
              {item.group}
            </div>
          )
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon"><i className={`fas ${item.icon}`} /></span>
              <span className="nav-label">{item.label}</span>
              {item.to === '/devices' && deviceCount > 0 && (
                <span className="nav-badge">{deviceCount}</span>
              )}
              {item.to === '/sensors' && sensorCount > 0 && (
                <span className="nav-badge">{sensorCount}</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-pill">
          <div className="user-avatar">
            {(user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.full_name || user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <i className="fas fa-right-from-bracket" />
          </button>
        </div>
        <div className="sidebar-bottom-row">
          <div className="mqtt-pill">
            <span className={`mqtt-dot${connected ? ' online' : ''}`} />
            <span>{connected ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={connect} className="icon-btn" title="Hubungkan MQTT">
            <i className="fas fa-wifi" />
          </button>
        </div>
      </div>
    </aside>
  )
}
