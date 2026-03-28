import { useState } from 'react'
import { useDevices } from '../hooks/useDevices'
import { getDeviceType, DEVICE_ICONS } from '../lib/cvConfig'

function DeviceCard({ device, onToggle, onEdit, onDelete }) {
  const isOn  = device.last_state === 1
  const dtype = getDeviceType(device.icon)

  return (
    <div
      className={`device-card device-${dtype}${isOn ? ' active on' : ''}`}
      id={`card-${device.id}`}
      onClick={() => onToggle(device.id, !isOn)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-controls-top">
        <div className="device-actions">
          <button className="card-action-btn" title="Edit"
            onClick={e => { e.stopPropagation(); onEdit(device) }}>
            <i className="fas fa-cog" />
          </button>
          <button className="card-action-btn trash" title="Hapus"
            onClick={e => { e.stopPropagation(); onDelete(device.id, device.name) }}>
            <i className="fas fa-trash" />
          </button>
        </div>
      </div>
      <div className="device-icon-wrap" style={{ opacity: isOn ? 1 : 0.6 }}>
        <i className={`fas ${device.icon || 'fa-plug'}`} style={{ fontSize: 28 }} />
      </div>
      <div className="device-info">
        <div className="device-name">{device.name}</div>
        <div className="device-usage">{isOn ? 'Aktif' : 'Standby'}</div>
      </div>
      <div className={`device-status-pill${isOn ? ' on' : ''}`}>
        {isOn ? 'ONLINE' : 'OFFLINE'}
      </div>
    </div>
  )
}

function DeviceModal({ device, onSave, onClose }) {
  const [form, setForm] = useState(
    device
      ? { name: device.name, icon: device.icon, topic_sub: device.topic_sub || '', topic_pub: device.topic_pub || '' }
      : { name: '', icon: 'fa-plug', topic_sub: '', topic_pub: '' }
  )
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))
  const handleTopic = e => setForm(p => ({ ...p, topic_sub: e.target.value, topic_pub: e.target.value }))

  return (
    <div className="modal-overlay active">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{device ? 'Edit Perangkat' : 'Tambah Perangkat'}</h3>
          <button onClick={onClose} className="modal-close"><i className="fas fa-times" /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Nama Perangkat</label>
            <input type="text" className="form-input" value={form.name} onChange={f('name')} placeholder="Lampu Utama" />
          </div>
          <div className="form-group">
            <label>Jenis</label>
            <select className="form-input" value={form.icon} onChange={f('icon')}>
              {DEVICE_ICONS.map(ic => (
                <option key={ic.value} value={ic.value}>{ic.label}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Topic MQTT</label>
            <input type="text" className="form-input" value={form.topic_sub} onChange={handleTopic} placeholder="iotzy/device/xxx" />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Batal</button>
          <button onClick={() => onSave(form)} className="btn-primary">
            {device ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Devices() {
  const { devices, loading, toggle, add, update, remove } = useDevices()
  const [modal, setModal]   = useState(null) // null | 'add' | device object
  const [search, setSearch] = useState('')

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (form) => {
    if (modal === 'add') await add(form)
    else await update(modal.id, form)
    setModal(null)
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus "${name}"?`)) return
    await remove(id)
  }

  if (loading) return <div className="view"><p className="muted" style={{ padding: 40 }}>Memuat perangkat...</p></div>

  return (
    <div className="view" id="devices">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-microchip" /> Perangkat</h3>
          <p>Kelola dan kontrol semua perangkat IoT Anda.</p>
        </div>
        <div className="v-actions">
          <div className="search-box">
            <i className="fas fa-search" />
            <input type="text" placeholder="Cari perangkat..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={() => setModal('add')}>
            <i className="fas fa-plus" /> Tambah Perangkat
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-microchip" />
          <p>Belum ada perangkat. Tambah perangkat baru untuk memulai.</p>
          <button className="btn-primary" onClick={() => setModal('add')}>Tambah Perangkat</button>
        </div>
      ) : (
        <div className="devices-grid" id="devicesGrid">
          {filtered.map(d => (
            <DeviceCard
              key={d.id}
              device={d}
              onToggle={toggle}
              onEdit={setModal}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal && (
        <DeviceModal
          device={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
