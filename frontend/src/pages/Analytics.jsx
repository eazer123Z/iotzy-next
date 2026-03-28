import { useState, useMemo } from 'react'
import { useLogs } from '../hooks/useLogs'

const LOG_COLORS = { success: '#10b981', info: '#3b82f6', warning: '#f59e0b', error: '#ef4444' }
const LOG_ICONS  = { success: 'fa-check-circle', info: 'fa-info-circle', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark' }

export default function Analytics() {
  const { logs, loading, clearLogs } = useLogs()
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch]         = useState('')

  const filtered = useMemo(() => logs.filter(l => {
    if (typeFilter !== 'all' && l.log_type !== typeFilter) return false
    if (search && !`${l.device_name} ${l.activity}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [logs, typeFilter, search])

  const stats = useMemo(() => ({
    total:   logs.length,
    success: logs.filter(l => l.log_type === 'success').length,
    warning: logs.filter(l => l.log_type === 'warning').length,
    error:   logs.filter(l => l.log_type === 'error').length,
  }), [logs])

  const handleClear = async () => {
    if (!confirm('Hapus semua log? Tindakan ini tidak bisa dibatalkan.')) return
    await clearLogs()
  }

  const exportLog = () => {
    const rows = [['Waktu', 'Perangkat', 'Aktivitas', 'Trigger', 'Tipe']]
    logs.forEach(l => rows.push([l.created_at, l.device_name, l.activity, l.trigger_type, l.log_type]))
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'iotzy-log.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) return <div className="view"><p className="muted" style={{ padding: 40 }}>Memuat log...</p></div>

  return (
    <div className="view" id="analytics">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-chart-bar" /> Log & Analytics</h3>
          <p>Riwayat aktivitas seluruh perangkat dan sistem IoT.</p>
        </div>
        <div className="v-actions">
          <button className="btn-secondary btn-sm" onClick={exportLog}>
            <i className="fas fa-file-export" /> Export
          </button>
          <button className="btn-danger btn-sm" onClick={handleClear}>
            <i className="fas fa-trash" /> Hapus Semua
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="log-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Aktivitas', val: stats.total,   icon: 'fa-list-ul',           color: '#3b82f6' },
          { label: 'Aksi Berhasil',   val: stats.success, icon: 'fa-check-circle',       color: '#10b981' },
          { label: 'Peringatan',      val: stats.warning, icon: 'fa-triangle-exclamation', color: '#f59e0b' },
          { label: 'Error',           val: stats.error,   icon: 'fa-circle-xmark',       color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 15, display: 'flex', alignItems: 'center', gap: 15 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${s.color}18`, color: s.color }}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{s.val}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="log-toolbar" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="log-filter-tabs" style={{ display: 'flex', gap: 6 }}>
          {['all', 'success', 'info', 'warning', 'error'].map(t => (
            <button
              key={t}
              className={`log-filter-tab${typeFilter === t ? ' active' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'all' ? 'Semua' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="search-box">
          <i className="fas fa-search" />
          <input type="text" placeholder="Cari log..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Log List */}
      <div id="logsContainer">
        {filtered.length === 0 ? (
          <p className="muted" style={{ textAlign: 'center', padding: 40 }}>Tidak ada log yang cocok.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((log, i) => (
              <div key={i} className="log-item" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, borderLeft: `3px solid ${LOG_COLORS[log.log_type] || '#64748b'}` }}>
                <i className={`fas ${LOG_ICONS[log.log_type] || 'fa-info-circle'}`} style={{ color: LOG_COLORS[log.log_type], marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                    <strong style={{ fontSize: '.85rem' }}>{log.device_name}</strong>
                    <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '1px 6px', borderRadius: 4 }}>
                      {log.trigger_type}
                    </span>
                  </div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-secondary)' }}>{log.activity}</div>
                </div>
                <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
