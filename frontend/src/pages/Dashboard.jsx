import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useMqtt } from '../context/MqttContext'
import { apiCall } from '../lib/api'
import { formatDuration } from '../lib/cvConfig'

export default function Dashboard({ devices, sensors }) {
  const { user }        = useAuth()
  const { connected }   = useMqtt()
  const [clock, setClock]   = useState('')
  const [cvState, setCvState] = useState({ person_count: 0, brightness: 0, light_condition: 'unknown' })
  const [activity, setActivity] = useState([])
  const [uptime, setUptime]     = useState(0)

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('id-ID', { hour12: false }))
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])

  // Uptime
  useEffect(() => {
    const start = Date.now()
    const id = setInterval(() => setUptime(Date.now() - start), 1000)
    return () => clearInterval(id)
  }, [])

  // Load activity & cv_state
  const loadDashboard = useCallback(async () => {
    const [logRes, dashRes] = await Promise.all([
      apiCall('get_logs', {}),
      apiCall('get_dashboard_data', {}),
    ])
    if (Array.isArray(logRes)) setActivity(logRes.slice(0, 10))
    else if (logRes?.logs) setActivity(logRes.logs.slice(0, 10))
    if (dashRes?.cv_state) setCvState(dashRes.cv_state)
  }, [])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const devicesOn  = devices.filter(d => d.last_state === 1).length
  const sensorsOnline = sensors.filter(s => {
    if (!s.last_seen) return false
    return (Date.now() - new Date(s.last_seen).getTime()) < 5 * 60 * 1000
  }).length

  const condLabel = { dark: 'Gelap', normal: 'Normal', bright: 'Terang' }
  const logColors = { success: '#10b981', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' }

  return (
    <div className="view" id="dashboard">
      <div className="overview-header">
        <div className="ov-title">
          <h1>Selamat Datang, {user?.username}</h1>
          <p>Ringkasan kondisi rumah pintar Anda saat ini.</p>
        </div>
        <div className="ov-date" id="ovClock">{clock}</div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><i className="fas fa-plug" /></div>
          <div className="stat-body">
            <div className="stat-value">{devicesOn}</div>
            <div className="stat-label">Perangkat Aktif</div>
            <div className="stat-sub">dari {devices.length} perangkat</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sky"><i className="fas fa-gauge-high" /></div>
          <div className="stat-body">
            <div className="stat-value">{sensorsOnline}</div>
            <div className="stat-label">Sensor Aktif</div>
            <div className="stat-sub">dari {sensors.length} sensor</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><i className="fas fa-clock" /></div>
          <div className="stat-body">
            <div className="stat-value" id="statUptimeVal">{formatDuration(uptime)}</div>
            <div className="stat-label">Uptime Sesi</div>
            <div className="stat-sub">sejak login</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><i className="fas fa-cloud" /></div>
          <div className="stat-body">
            <div className="stat-value" id="statMqttVal">{connected ? 'ON' : 'OFF'}</div>
            <div className="stat-label">Koneksi Cloud</div>
            <div className="stat-sub">{connected ? 'Terhubung' : 'Menghubungkan...'}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        <div className="ov-main-col">
          {/* Activity Feed */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <i className="fas fa-clock-rotate-left" /> Aktivitas Terbaru
              </span>
              <button onClick={loadDashboard} className="icon-btn" title="Refresh">
                <i className="fas fa-rotate-right" />
              </button>
            </div>
            <div className="card-body">
              <div className="activity-feed" id="activityFeedContainer">
                {activity.length === 0 ? (
                  <p className="muted" style={{ textAlign: 'center', fontSize: '.85rem' }}>
                    Belum ada aktivitas
                  </p>
                ) : activity.map((log, i) => (
                  <div key={i} className="activity-item" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: logColors[log.log_type] || '#64748b', fontSize: 12, marginTop: 2 }}>
                      <i className={`fas fa-circle`} />
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '.82rem', fontWeight: 600 }}>{log.device_name}</div>
                      <div style={{ fontSize: '.78rem', color: 'var(--text-secondary)' }}>{log.activity}</div>
                    </div>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="ov-side-col">
          {/* Kondisi Ruangan */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fas fa-shield-halved" /> Kondisi Ruangan</span>
            </div>
            <div className="card-body summary-list" id="ovStatusSummary">
              <div className="summary-item" style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.2rem', width: 30, textAlign: 'center' }}>
                  <i className="fas fa-users" />
                </div>
                <div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Kehadiran Orang</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 600, color: cvState.person_count > 0 ? '#10b981' : 'inherit' }}>
                    {cvState.person_count > 0 ? `Terdeteksi (${cvState.person_count})` : 'Tidak Terdeteksi'}
                  </div>
                </div>
              </div>
              <div className="summary-item" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ color: '#fbbf24', fontSize: '1.2rem', width: 30, textAlign: 'center' }}>
                  <i className="fas fa-lightbulb" />
                </div>
                <div>
                  <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Kondisi Cahaya</div>
                  <div style={{ fontSize: '.9rem', fontWeight: 600 }}>
                    {condLabel[cvState.light_condition] || 'Memindai...'} ({Math.round((cvState.brightness || 0) * 100)}%)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fas fa-chart-pie" /> Ringkasan</span>
            </div>
            <div className="card-body">
              {devices.slice(0, 4).map(d => (
                <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '.83rem' }}>
                  <span><i className={`fas ${d.icon || 'fa-plug'}`} style={{ marginRight: 8, opacity: .7 }} />{d.name}</span>
                  <span style={{ color: d.last_state ? '#10b981' : 'var(--text-muted)', fontWeight: 600, fontSize: '.75rem' }}>
                    {d.last_state ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
              {devices.length === 0 && <p className="muted" style={{ fontSize: '.83rem' }}>Belum ada perangkat</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
