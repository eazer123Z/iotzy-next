import { useState } from 'react'
import { useSensors } from '../hooks/useSensors'
import { SENSOR_CONFIG, SENSOR_LABELS } from '../lib/cvConfig'

const SENSOR_TYPES = Object.keys(SENSOR_CONFIG)

function SensorCard({ sensor, onEdit, onDelete }) {
  const cfg   = SENSOR_CONFIG[sensor.type] || {}
  const val   = sensor.latest_value
  const hasVal = val !== null && val !== undefined
  const isOnline = sensor.last_seen &&
    (Date.now() - new Date(sensor.last_seen).getTime()) < 5 * 60 * 1000

  const pct = hasVal && cfg.min !== undefined
    ? Math.min(100, Math.max(0, ((val - cfg.min) / (cfg.max - cfg.min)) * 100))
    : 0

  return (
    <div className="sensor-card" id={`sensor-card-${sensor.id}`} data-type={sensor.type}>
      <div className="sensor-card-top">
        <div className="sensor-card-info">
          <div className="sensor-big-icon" style={{ background: cfg.color ? `${cfg.color}22` : 'var(--surface-hover)' }}>
            <i className={`fas ${sensor.icon || cfg.icon || 'fa-microchip'}`} style={{ color: cfg.color || 'var(--text-secondary)' }} />
          </div>
          <div>
            <div className="sensor-name">{sensor.name}</div>
            <div className="sensor-type-label">{SENSOR_LABELS[sensor.type] || sensor.type}</div>
          </div>
        </div>
        <div className="sensor-actions">
          <button className="card-action-btn" onClick={() => onEdit(sensor)} title="Edit">
            <i className="fas fa-cog" />
          </button>
          <button className="card-action-btn trash" onClick={() => onDelete(sensor.id, sensor.name)} title="Hapus">
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>

      <div className="sensor-value-display">
        {hasVal ? (
          <span className="sensor-val-big" style={{ color: cfg.color }}>
            {parseFloat(val).toFixed(1)}<span className="sensor-unit">{cfg.unit || sensor.unit}</span>
          </span>
        ) : (
          <span className="sensor-val-big muted">—</span>
        )}
      </div>

      {cfg.min !== undefined && (
        <div className="sensor-bar-wrap">
          <div className="sensor-bar">
            <div className="sensor-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
          </div>
          <div className="sensor-bar-labels">
            <span>{cfg.min}{cfg.unit}</span>
            <span>{cfg.max}{cfg.unit}</span>
          </div>
        </div>
      )}

      <div className="sensor-footer">
        <span className={`sensor-status-dot${isOnline ? ' online' : ''}`} />
        <span className="sensor-topic" title={sensor.topic}>{sensor.topic}</span>
      </div>
    </div>
  )
}

function SensorModal({ sensor, onSave, onClose }) {
  const [form, setForm] = useState(
    sensor
      ? { name: sensor.name, sensor_type: sensor.type, topic: sensor.topic }
      : { name: '', sensor_type: 'temperature', topic: '' }
  )
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{sensor ? 'Edit Sensor' : 'Tambah Sensor'}</h3>
          <button onClick={onClose} className="modal-close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nama Sensor</label>
            <input type="text" className="form-input" value={form.name} onChange={f('name')} placeholder="Sensor Suhu" />
          </div>
          <div className="form-group">
            <label>Tipe Sensor</label>
            <select className="form-input" value={form.sensor_type} onChange={f('sensor_type')}>
              {SENSOR_TYPES.map(t => (
                <option key={t} value={t}>{SENSOR_LABELS[t] || t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Topic MQTT</label>
            <input type="text" className="form-input" value={form.topic} onChange={f('topic')} placeholder="iotzy/sensor/suhu" />
          </div>
          <small style={{ color: 'var(--text-muted)' }}>
            Satuan: {SENSOR_CONFIG[form.sensor_type]?.unit || '—'}
          </small>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={() => onSave(form)} className="btn-primary">
            {sensor ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Sensors() {
  const { sensors, loading, add, update, remove } = useSensors()
  const [modal, setModal]   = useState(null)
  const [search, setSearch] = useState('')

  const filtered = sensors.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form) => {
    if (modal === 'add') await add(form)
    else await update(modal.id, form)
    setModal(null)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus sensor "${name}"?`)) return
    await remove(id)
  }

  if (loading) return <div className="view"><p className="muted" style={{ padding: 40 }}>Memuat sensor...</p></div>

  return (
    <div className="view" id="sensors">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-signal" /> Sensor</h3>
          <p>Monitor data sensor IoT secara real-time.</p>
        </div>
        <div className="v-actions">
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Cari sensor..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setModal('add')}>
            <i className="fas fa-plus" /> Tambah Sensor
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-signal" />
          <p>Belum ada sensor. Tambah sensor baru untuk mulai monitoring.</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Tambah Sensor</button>
        </div>
      ) : (
        <div className="sensors-grid">
          {filtered.map(s => (
            <SensorCard key={s.id} sensor={s} onEdit={setModal} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {modal && (
        <SensorModal
          sensor={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
