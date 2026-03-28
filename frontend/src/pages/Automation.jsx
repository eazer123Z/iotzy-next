import { useState } from 'react'
import { useAutomation } from '../hooks/useAutomation'

const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const CONDITIONS = [
  { value: 'gt', label: 'Lebih dari (>)' },
  { value: 'lt', label: 'Kurang dari (<)' },
  { value: 'between', label: 'Di antara (range)' },
]

function RuleCard({ rule, onDelete, onToggle }) {
  const isOn = rule.is_enabled === 1 || rule.is_enabled === true
  return (
    <div className={`automation-card${isOn ? ' enabled' : ''}`}>
      <div className="auto-card-header">
        <div className="auto-meta">
          <span className="auto-sensor">{rule.sensor_name || '—'}</span>
          <span className="auto-arrow"><i className="fas fa-arrow-right" /></span>
          <span className="auto-device">{rule.device_name || '—'}</span>
        </div>
        <div className="auto-actions">
          <button
            className={`toggle-btn${isOn ? ' on' : ''}`}
            onClick={() => onToggle(rule.id, !isOn)}
            title={isOn ? 'Nonaktifkan' : 'Aktifkan'}
          >
            <i className={`fas ${isOn ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
          </button>
          <button className="card-action-btn trash" onClick={() => onDelete(rule.id)} title="Hapus">
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>
      <div className="auto-detail">
        <span className="auto-condition">
          {rule.condition_type === 'between'
            ? `${rule.threshold_min} – ${rule.threshold_max} ${rule.unit || ''}`
            : `${rule.condition_type === 'gt' ? '>' : '<'} ${rule.threshold} ${rule.unit || ''}`}
        </span>
        <span className={`auto-action-badge ${rule.action}`}>{rule.action?.toUpperCase()}</span>
        {rule.start_time && <span className="auto-time">{rule.start_time} – {rule.end_time}</span>}
      </div>
    </div>
  )
}

function ScheduleCard({ schedule, onDelete, onToggle }) {
  const isOn = schedule.is_enabled === 1 || schedule.is_enabled === true
  const days = (() => {
    try { return JSON.parse(schedule.days || '[]') } catch { return [] }
  })()
  const devNames = (() => {
    try { return JSON.parse(schedule.devices || '[]') } catch { return [] }
  })()

  return (
    <div className={`automation-card${isOn ? ' enabled' : ''}`}>
      <div className="auto-card-header">
        <div className="auto-meta">
          <i className="fas fa-clock" style={{ marginRight: 6, opacity: .7 }} />
          <strong>{schedule.label || 'Jadwal'}</strong>
          <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: '.8rem' }}>
            {schedule.time_hhmm}
          </span>
        </div>
        <div className="auto-actions">
          <button className={`toggle-btn${isOn ? ' on' : ''}`} onClick={() => onToggle(schedule.id, !isOn)}>
            <i className={`fas ${isOn ? 'fa-toggle-on' : 'fa-toggle-off'}`} />
          </button>
          <button className="card-action-btn trash" onClick={() => onDelete(schedule.id)}>
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>
      <div className="auto-detail">
        <span>{days.map(d => DAYS[d]).join(', ') || 'Setiap hari'}</span>
        <span className={`auto-action-badge ${schedule.action}`}>{schedule.action?.toUpperCase()}</span>
        <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>{devNames.length} perangkat</span>
      </div>
    </div>
  )
}

export default function Automation({ devices = [], sensors = [] }) {
  const { rules, schedules, loading, addRule, deleteRule, updateRule, addSchedule, toggleSchedule, deleteSchedule } = useAutomation()
  const [tab, setTab]     = useState('rules')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]   = useState({
    sensor_id: '', device_id: '', condition_type: 'gt',
    threshold: '', threshold_min: '', threshold_max: '',
    action: 'on', start_time: '', end_time: '', delay_ms: 0,
  })
  const [schedForm, setSchedForm] = useState({
    label: '', time_hhmm: '08:00', days: [1,2,3,4,5],
    action: 'on', device_ids: [],
  })

  const f  = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const sf = k => e => setSchedForm(p => ({ ...p, [k]: e.target.value }))

  const handleAddRule = async () => {
    await addRule(form)
    setShowAdd(false)
  }

  const handleAddSchedule = async () => {
    await addSchedule(schedForm)
    setShowAdd(false)
  }

  const handleDeleteRule = async (id) => {
    if (!confirm('Hapus aturan ini?')) return
    await deleteRule(id)
  }

  const handleDeleteSchedule = async (id) => {
    if (!confirm('Hapus jadwal ini?')) return
    await deleteSchedule(id)
  }

  if (loading) return <div className="view"><p className="muted" style={{ padding: 40 }}>Memuat automasi...</p></div>

  return (
    <div className="view" id="automation">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-robot" /> Rules Engine</h3>
          <p>Otomatisasi cerdas berdasarkan sensor, jadwal, dan kondisi lingkungan.</p>
        </div>
        <div className="v-actions">
          <button className="btn-primary" onClick={() => setShowAdd(true)}>
            <i className="fas fa-plus" /> Buat Aturan Baru
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="settings-tabs" style={{ marginBottom: 20 }}>
        <button className={`settings-tab${tab === 'rules' ? ' active' : ''}`} onClick={() => setTab('rules')}>
          Aturan Sensor ({rules.length})
        </button>
        <button className={`settings-tab${tab === 'schedules' ? ' active' : ''}`} onClick={() => setTab('schedules')}>
          Jadwal ({schedules.length})
        </button>
      </div>

      {tab === 'rules' && (
        rules.length === 0
          ? <div className="empty-state"><i className="fas fa-sliders" /><p>Belum ada aturan otomasi.</p></div>
          : <div className="automation-grid" id="automationGrid">
              {rules.map(r => (
                <RuleCard key={r.id} rule={r}
                  onDelete={handleDeleteRule}
                  onToggle={(id, en) => updateRule(id, { is_enabled: en ? 1 : 0 })}
                />
              ))}
            </div>
      )}

      {tab === 'schedules' && (
        schedules.length === 0
          ? <div className="empty-state"><i className="fas fa-clock" /><p>Belum ada jadwal.</p></div>
          : <div className="automation-grid">
              {schedules.map(s => (
                <ScheduleCard key={s.id} schedule={s}
                  onDelete={handleDeleteSchedule}
                  onToggle={toggleSchedule}
                />
              ))}
            </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay active">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3>Buat Aturan Baru</h3>
              <button onClick={() => setShowAdd(false)} className="modal-close"><i className="fas fa-times" /></button>
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0', borderBottom: '1px solid var(--border)' }}>
              <button className={`settings-tab${tab === 'rules' ? ' active' : ''}`} onClick={() => setTab('rules')}>Sensor</button>
              <button className={`settings-tab${tab === 'schedules' ? ' active' : ''}`} onClick={() => setTab('schedules')}>Jadwal</button>
            </div>

            <div className="modal-body">
              {tab === 'rules' ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sensor</label>
                      <select className="form-input" value={form.sensor_id} onChange={f('sensor_id')}>
                        <option value="">— Pilih Sensor —</option>
                        {sensors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Perangkat</label>
                      <select className="form-input" value={form.device_id} onChange={f('device_id')}>
                        <option value="">— Pilih Perangkat —</option>
                        {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Kondisi</label>
                    <select className="form-input" value={form.condition_type} onChange={f('condition_type')}>
                      {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  {form.condition_type === 'between' ? (
                    <div className="form-row">
                      <div className="form-group">
                        <label>Batas Bawah</label>
                        <input type="number" className="form-input" value={form.threshold_min} onChange={f('threshold_min')} step="0.1" />
                      </div>
                      <div className="form-group">
                        <label>Batas Atas</label>
                        <input type="number" className="form-input" value={form.threshold_max} onChange={f('threshold_max')} step="0.1" />
                      </div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label>Nilai Ambang</label>
                      <input type="number" className="form-input" value={form.threshold} onChange={f('threshold')} step="0.1" />
                    </div>
                  )}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Aksi</label>
                      <select className="form-input" value={form.action} onChange={f('action')}>
                        <option value="on">Nyalakan (ON)</option>
                        <option value="off">Matikan (OFF)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Delay (ms)</label>
                      <input type="number" className="form-input" value={form.delay_ms} onChange={f('delay_ms')} min="0" step="500" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Aktif Dari</label><input type="time" className="form-input" value={form.start_time} onChange={f('start_time')} /></div>
                    <div className="form-group"><label>Aktif Hingga</label><input type="time" className="form-input" value={form.end_time} onChange={f('end_time')} /></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Label Jadwal</label>
                    <input type="text" className="form-input" value={schedForm.label} onChange={sf('label')} placeholder="Nyalain lampu pagi" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Waktu</label>
                      <input type="time" className="form-input" value={schedForm.time_hhmm} onChange={sf('time_hhmm')} />
                    </div>
                    <div className="form-group">
                      <label>Aksi</label>
                      <select className="form-input" value={schedForm.action} onChange={sf('action')}>
                        <option value="on">Nyalakan (ON)</option>
                        <option value="off">Matikan (OFF)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Perangkat</label>
                    <select className="form-input" value={schedForm.device_ids[0] || ''} onChange={e => setSchedForm(p => ({ ...p, device_ids: [e.target.value] }))}>
                      <option value="">— Pilih Perangkat —</option>
                      {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowAdd(false)} className="btn-secondary">Batal</button>
              <button onClick={tab === 'rules' ? handleAddRule : handleAddSchedule} className="btn-primary">
                Buat Aturan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
