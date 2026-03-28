import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useMqtt } from '../context/MqttContext'
import { useSettings } from '../hooks/useSettings'
import { apiCall } from '../lib/api'

export default function Settings() {
  const { user, settings: authSettings, refreshSettings } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { connect } = useMqtt()
  const { saving, save, saveProfile, changePassword, getMqttTemplates, testTelegram } = useSettings()

  const [tab, setTab] = useState('profile')
  const [templates, setTemplates] = useState([])
  const [toast, setToast] = useState('')

  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [mqtt, setMqtt] = useState({ mqtt_broker: '', mqtt_port: 8884, mqtt_use_ssl: true, mqtt_username: '', mqtt_password: '', mqtt_path: '/mqtt', mqtt_client_id: '' })
  const [telegram, setTelegram] = useState({ telegram_chat_id: '' })
  const [automation, setAutomation] = useState({ automation_lamp: true, automation_fan: true, automation_lock: true, lamp_on_threshold: 0.3, lamp_off_threshold: 0.7, fan_temp_high: 30, fan_temp_normal: 25, lock_delay: 5000 })

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }, [])

  // Pakai settings dari AuthContext dulu (sudah ada, tidak perlu fetch ulang)
  // Hanya fetch template MQTT yang belum ada
  useEffect(() => {
    const s = authSettings ?? {}
    if (s.mqtt_broker) setMqtt(m => ({
      ...m,
      mqtt_broker: s.mqtt_broker,
      mqtt_port: s.mqtt_port || 8884,
      mqtt_use_ssl: !!s.mqtt_use_ssl,
      mqtt_username: s.mqtt_username || '',
      mqtt_path: s.mqtt_path || '/mqtt',
      mqtt_client_id: s.mqtt_client_id || '',
    }))
    if (s.telegram_chat_id) setTelegram({ telegram_chat_id: s.telegram_chat_id })
    setAutomation(a => ({
      ...a,
      automation_lamp: !!s.automation_lamp,
      automation_fan: !!s.automation_fan,
      automation_lock: !!s.automation_lock,
      lamp_on_threshold: s.lamp_on_threshold ?? 0.3,
      lamp_off_threshold: s.lamp_off_threshold ?? 0.7,
      fan_temp_high: s.fan_temp_high ?? 30,
      fan_temp_normal: s.fan_temp_normal ?? 25,
      lock_delay: s.lock_delay ?? 5000,
    }))
  }, [authSettings])

  // Fetch template MQTT sekali saja
  useEffect(() => {
    getMqttTemplates().then(res => setTemplates(res?.templates ?? []))
  }, [getMqttTemplates])

  const pf = k => e => setProfile(p => ({ ...p, [k]: e.target.value }))
  const mf = k => e => setMqtt(m => ({ ...m, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const af = k => e => setAutomation(a => ({ ...a, [k]: e.target.type === 'checkbox' ? e.target.checked : parseFloat(e.target.value) }))

  const handleSaveProfile = async () => {
    const res = await saveProfile(profile)
    showToast(res?.success ? 'Profil berhasil disimpan!' : (res?.error || 'Gagal'))
  }

  const handleChangePassword = async () => {
    if (passwords.new_password !== passwords.confirm_password) { showToast('Password baru tidak cocok!'); return }
    const res = await changePassword(passwords)
    showToast(res?.success ? 'Password berhasil diubah!' : (res?.error || 'Gagal'))
    if (res?.success) setPasswords({ current_password: '', new_password: '', confirm_password: '' })
  }

  const handleSaveMqtt = async () => {
    const res = await save(mqtt)
    if (res?.success) { showToast('MQTT berhasil disimpan!'); connect(); refreshSettings() }
    else showToast(res?.error || 'Gagal')
  }

  const handleSaveTelegram = async () => {
    const res = await save(telegram)
    showToast(res?.success ? 'Telegram berhasil disimpan!' : (res?.error || 'Gagal'))
  }

  const handleSaveAutomation = async () => {
    const res = await save(automation)
    showToast(res?.success ? 'Pengaturan automasi disimpan!' : (res?.error || 'Gagal'))
  }

  const handleTestTelegram = async () => {
    const res = await testTelegram()
    showToast(res?.success ? 'Pesan test Telegram terkirim!' : (res?.error || 'Gagal kirim'))
  }

  const applyTemplate = (slug) => {
    const t = templates.find(x => x.slug === slug)
    if (!t) return
    setMqtt(m => ({ ...m, mqtt_broker: t.broker, mqtt_port: t.port, mqtt_use_ssl: !!t.use_ssl, mqtt_path: t.path, mqtt_username: t.username || '' }))
  }

  const TABS = [
    { id: 'profile', icon: 'fa-user', label: 'Profil' },
    { id: 'mqtt', icon: 'fa-wifi', label: 'MQTT' },
    { id: 'telegram', icon: 'fa-paper-plane', label: 'Telegram' },
    { id: 'automation', icon: 'fa-robot', label: 'Automasi CV' },
    { id: 'appearance', icon: 'fa-palette', label: 'Tampilan' },
  ]

  return (
    <div className="view" id="settings">
      {toast && (
        <div className="toast-msg" style={{ position: 'fixed', top: 80, right: 20, zIndex: 9999, background: 'var(--primary)', color: '#fff', padding: '10px 20px', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.3)', fontSize: '.9rem' }}>
          {toast}
        </div>
      )}

      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-gear" /> Pengaturan</h3>
          <p>Kelola profil, koneksi, dan preferensi sistem IoTzy.</p>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="settings-tabs" style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`tab-btn${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`fas ${t.icon}`} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Profil ── */}
      {tab === 'profile' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-user" /> Informasi Profil</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Username</label>
                <input className="form-input" value={user?.username || ''} disabled />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input className="form-input" value={profile.full_name} onChange={pf('full_name')} placeholder="Nama lengkap" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={profile.email} onChange={pf('email')} placeholder="email@example.com" />
              </div>
              <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan Profil</>}
              </button>
            </div>
          </div>

          <div className="card" style={{ maxWidth: 560, marginTop: 20 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-lock" /> Ubah Password</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['current_password', 'new_password', 'confirm_password'].map(k => (
                <div className="form-group" key={k}>
                  <label>{k === 'current_password' ? 'Password Saat Ini' : k === 'new_password' ? 'Password Baru' : 'Konfirmasi Password'}</label>
                  <input className="form-input" type="password" value={passwords[k]}
                    onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))}
                    placeholder="••••••••" />
                </div>
              ))}
              <button className="btn-primary" onClick={handleChangePassword} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Mengubah...</> : <><i className="fas fa-key" /> Ubah Password</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MQTT ── */}
      {tab === 'mqtt' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-wifi" /> Konfigurasi MQTT</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {templates.length > 0 && (
                <div className="form-group">
                  <label>Template Broker</label>
                  <select className="form-input" onChange={e => applyTemplate(e.target.value)} defaultValue="">
                    <option value="">-- Pilih template --</option>
                    {templates.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Broker Host</label>
                <input className="form-input" value={mqtt.mqtt_broker} onChange={mf('mqtt_broker')} placeholder="broker.example.com" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Port</label>
                  <input className="form-input" type="number" value={mqtt.mqtt_port} onChange={mf('mqtt_port')} />
                </div>
                <div className="form-group">
                  <label>Path</label>
                  <input className="form-input" value={mqtt.mqtt_path} onChange={mf('mqtt_path')} />
                </div>
              </div>
              <div className="form-group">
                <label>Username</label>
                <input className="form-input" value={mqtt.mqtt_username} onChange={mf('mqtt_username')} />
              </div>
              <div className="form-group">
                <label>Client ID (opsional)</label>
                <input className="form-input" value={mqtt.mqtt_client_id} onChange={mf('mqtt_client_id')} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.9rem' }}>
                <input type="checkbox" checked={mqtt.mqtt_use_ssl} onChange={mf('mqtt_use_ssl')} />
                Gunakan SSL/TLS (WSS)
              </label>
              <button className="btn-primary" onClick={handleSaveMqtt} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan & Hubungkan</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Telegram ── */}
      {tab === 'telegram' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-paper-plane" /> Notifikasi Telegram</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label>Chat ID Telegram</label>
                <input className="form-input" value={telegram.telegram_chat_id} onChange={e => setTelegram({ telegram_chat_id: e.target.value })} placeholder="Contoh: 123456789" />
                <small style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                  Kirim pesan ke bot IoTzy kamu, lalu cek Chat ID-nya di @userinfobot
                </small>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-primary" onClick={handleSaveTelegram} disabled={saving}>
                  {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan</>}
                </button>
                <button className="btn-secondary" onClick={handleTestTelegram}>
                  <i className="fas fa-paper-plane" /> Kirim Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Automasi CV ── */}
      {tab === 'automation' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-robot" /> Pengaturan Automasi CV</span></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'automation_lamp', label: 'Automasi Lampu (berdasarkan cahaya)' },
                { key: 'automation_fan', label: 'Automasi Kipas (berdasarkan suhu)' },
                { key: 'automation_lock', label: 'Automasi Kunci (berdasarkan kehadiran)' },
              ].map(({ key, label }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '.9rem' }}>
                  <input type="checkbox" checked={automation[key]} onChange={af(key)} />
                  {label}
                </label>
              ))}
              <hr style={{ border: 'none', borderTop: '1px solid var(--border)' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'lamp_on_threshold', label: 'Nyala lampu (cahaya <)', step: 0.05, min: 0, max: 1 },
                  { key: 'lamp_off_threshold', label: 'Matikan lampu (cahaya >)', step: 0.05, min: 0, max: 1 },
                  { key: 'fan_temp_high', label: 'Suhu nyalakan kipas (°C)', step: 1, min: 20, max: 50 },
                  { key: 'fan_temp_normal', label: 'Suhu matikan kipas (°C)', step: 1, min: 15, max: 45 },
                ].map(({ key, label, step, min, max }) => (
                  <div className="form-group" key={key}>
                    <label style={{ fontSize: '.8rem' }}>{label}</label>
                    <input className="form-input" type="number" step={step} min={min} max={max}
                      value={automation[key]} onChange={af(key)} />
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={handleSaveAutomation} disabled={saving}>
                {saving ? <><i className="fas fa-spinner fa-spin" /> Menyimpan...</> : <><i className="fas fa-save" /> Simpan Automasi</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tampilan ── */}
      {tab === 'appearance' && (
        <div className="settings-section">
          <div className="card" style={{ maxWidth: 560 }}>
            <div className="card-header"><span className="card-title"><i className="fas fa-palette" /> Tampilan</span></div>
            <div className="card-body">
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <span><i className={`fas fa-${theme === 'dark' ? 'moon' : 'sun'}`} /> Mode {theme === 'dark' ? 'Gelap' : 'Terang'}</span>
                <button className="btn-secondary" onClick={toggleTheme}>
                  Ganti ke {theme === 'dark' ? 'Terang' : 'Gelap'}
                </button>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}