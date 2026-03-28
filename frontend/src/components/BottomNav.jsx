import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/',           icon: 'fa-house',     label: 'Home' },
  { to: '/devices',    icon: 'fa-microchip', label: 'Perangkat' },
  { to: '/automation', icon: 'fa-robot',     label: 'Automasi' },
  { to: '/camera',     icon: 'fa-eye',       label: 'Vision' },
  { to: '/settings',   icon: 'fa-gear',      label: 'Settings' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}
        >
          <i className={`fas ${item.icon}`} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
