import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useMqtt } from '../context/MqttContext'
import { useSettings } from '../hooks/useSettings'
import { apiCall } from '../lib/api'

export default function Settings() {
  const { user, refreshSettings } = useAuth()
  const { theme, toggleTheme }    = useTheme()
  const { connect }               = useMqtt()
  const { saving, save, saveProfile, changePassword, getMqttTemplates, testTelegram } = useSettings()

  const [tab, setTab]             = useState('profile')
  const [templates, setTemplates] = useState([])
  const [toast, setToast]         = useState('')

  const [profile, setProfile] = useState({ full_name: user?.full_name || '', email: user?.email || '' })
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [mqtt, setMqtt] = useState({ mqtt_broker: '', mqtt_port: 8884, mqtt_use_ssl: true, mqtt_username: '', mqtt_password: '', mqtt_path: '/mqtt', mqtt_client_id: '' })
  const [telegram, setTelegram] = useState({ telegram_chat_id: '' })
  const [automation, setAutomation] = useState({ automation_lamp: true, automation_fan: true, automation_lock: true, lamp_on_threshold: 0.3, lamp_off_threshold: 0.7, fan_temp_high: 30, fan_temp_normal: 25, lock_delay: 5000 })

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  useEffect(() => {
    // Load current settings
    apiCall('get_settings').then(res => {
      const s = res?.settings ?? res ?? {}
      if (s.mqtt_broker) setMqtt(m => ({ ...m, mqtt_broker: s.mqtt_broker, mqtt_port: s.mqtt_port || 8884, mqtt_use_ssl: !!s.mqtt_use_ssl, mqtt_username: s.mqtt_username || '', mqtt_path: s.mqtt_path || '/mqtt', mqtt_client_id: s.mqtt_client_id || '' }))
      if (s.telegram_chat_id) setTelegram({ telegram_chat_id: s.telegram_chat_id })
      setAutomation(a => ({ ...a, automation_lamp: !!s.automation_lamp, automation_fan: !!s.automation_fan, automation_lock: !!s.automation_lock, lamp_on_threshold: s.lamp_on_threshold ?? 0.3, lamp_off_threshold: s.lamp_off_threshold ?? 0.7, fan_temp_high: s.fan_temp_high ?? 30, fan_temp_normal: s.fan_temp_normal ?? 25, lock_delay: s.lock_delay ?? 5000 }))
    })
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
    if (res?.success) { showToast('MQTT berhasil disimpan!'); connect() }
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
    { id: 'profile', label: 'Profil', icon: 'fa-user' },
    { id: 'mqtt',    label: 'MQTT',   icon: 'fa-wifi' },
    { id: 'telegram', label: 'Telegram', icon: 'fa-paper-plane' },
    { id: 'automation', label: 'Automasi', icon: 'fa-robot' },
    { id: 'tampilan', label: 'Tampilan', icon: 'fa-palette' },
  ]

  return (
    <div className="view" id="settings">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-gear" /> Pengaturan</h3>
          <p>Konfigurasi akun, koneksi, dan perilaku sistem.</p>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: 8, zIndex: 999, fontWeight: 600 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Tab list */}
        <div className="settings-tab-list" style={{ minWidth: 160, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`settings-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <i className={`fas ${t.icon}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="settings-panel-wrap" style={{ flex: 1 }}>

          {tab === 'profile' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Informasi Profil</span></div>
              <div className="card-body">
                <div className="form-group"><label>Nama Lengkap</label>
                  <input type="text" className="form-input" value={profile.full_name} onChange={pf('full_name')} />
                </div>
                <div className="form-group"><label>Email</label>
                  <input type="email" className="form-input" value={profile.email} onChange={pf('email')} />
                </div>
                <div className="form-group"><label>Username</label>
                  <input type="text" className="form-input" value={user?.username || ''} disabled style={{ opacity: .6 }} />
                </div>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                  <i className="fas fa-save" /> Simpan Profil
                </button>

                <hr style={{ margin: '24px 0', borderColor: 'var(--border)' }} />

                <h4 style={{ marginBottom: 16 }}>Ubah Password</h4>
                {['current_password', 'new_password', 'confirm_password'].map(k => (
                  <div key={k} className="form-group">
                    <label>{{ current_password: 'Password Saat Ini', new_password: 'Password Baru', confirm_password: 'Konfirmasi Password' }[k]}</label>
                    <input type="password" className="form-input" value={passwords[k]}
                      onChange={e => setPasswords(p => ({ ...p, [k]: e.target.value }))} />
                  </div>
                ))}
                <button className="btn-secondary" onClick={handleChangePassword} disabled={saving}>
                  <i className="fas fa-key" /> Ubah Password
                </button>
              </div>
            </div>
          )}

          {tab === 'mqtt' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Konfigurasi MQTT</span></div>
              <div className="card-body">
                {templates.length > 0 && (
                  <div className="form-group">
                    <label>Template Broker</label>
                    <select className="form-input" onChange={e => applyTemplate(e.target.value)}>
                      <option value="">— Pilih Template —</option>
                      {templates.map(t => <option key={t.slug} value={t.slug}>{t.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group"><label>Broker URL</label>
                  <input type="text" className="form-input" value={mqtt.mqtt_broker} onChange={mf('mqtt_broker')} placeholder="broker.hivemq.com" />
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Port</label>
                    <input type="number" className="form-input" value={mqtt.mqtt_port} onChange={mf('mqtt_port')} />
                  </div>
                  <div className="form-group"><label>Path</label>
                    <input type="text" className="form-input" value={mqtt.mqtt_path} onChange={mf('mqtt_path')} />
                  </div>
                </div>
                <div className="form-group"><label>Client ID</label>
                  <input type="text" className="form-input" value={mqtt.mqtt_client_id} onChange={mf('mqtt_client_id')} placeholder="iotzy_web" />
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Username</label>
                    <input type="text" className="form-input" value={mqtt.mqtt_username} onChange={mf('mqtt_username')} />
                  </div>
                  <div className="form-group"><label>Password</label>
                    <input type="password" className="form-input" value={mqtt.mqtt_password} onChange={mf('mqtt_password')} />
                  </div>
                </div>
                <label className="form-check">
                  <input type="checkbox" checked={mqtt.mqtt_use_ssl} onChange={mf('mqtt_use_ssl')} /> SSL/TLS (WSS)
                </label>
                <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                  <button className="btn-primary" onClick={handleSaveMqtt} disabled={saving}>
                    <i className="fas fa-save" /> Simpan & Hubungkan
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'telegram' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Integrasi Telegram</span></div>
              <div className="card-body">
                <p style={{ fontSize: '.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Hubungkan akun Telegram untuk menerima notifikasi dan mengirim perintah lewat chat.
                </p>
                <div className="form-group">
                  <label>Telegram Chat ID</label>
                  <input type="text" className="form-input" value={telegram.telegram_chat_id}
                    onChange={e => setTelegram({ telegram_chat_id: e.target.value })}
                    placeholder="Contoh: 123456789" />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Kirim /start ke bot Anda untuk mendapatkan Chat ID.
                  </small>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" onClick={handleSaveTelegram} disabled={saving}>
                    <i className="fas fa-save" /> Simpan
                  </button>
                  <button className="btn-secondary" onClick={handleTestTelegram}>
                    <i className="fas fa-paper-plane" /> Test Notifikasi
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'automation' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Automasi Bawaan</span></div>
              <div className="card-body">
                {[
                  { key: 'automation_lamp', label: 'Otomasi Lampu (berdasarkan kecerahan)' },
                  { key: 'automation_fan',  label: 'Otomasi Kipas (berdasarkan suhu)' },
                  { key: 'automation_lock', label: 'Otomasi Kunci (smart lock)' },
                ].map(item => (
                  <label key={item.key} className="form-check" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                    <input type="checkbox" checked={automation[item.key]} onChange={af(item.key)} />
                    {item.label}
                  </label>
                ))}

                <hr style={{ margin: '20px 0', borderColor: 'var(--border)' }} />

                <h4 style={{ marginBottom: 14 }}>Ambang Batas Lampu</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nyala saat kecerahan ≤</label>
                    <input type="number" className="form-input" value={automation.lamp_on_threshold} onChange={af('lamp_on_threshold')} step="0.05" min="0" max="1" />
                  </div>
                  <div className="form-group">
                    <label>Mati saat kecerahan ≥</label>
                    <input type="number" className="form-input" value={automation.lamp_off_threshold} onChange={af('lamp_off_threshold')} step="0.05" min="0" max="1" />
                  </div>
                </div>

                <h4 style={{ margin: '16px 0 14px' }}>Ambang Batas Kipas</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nyala saat suhu ≥ (°C)</label>
                    <input type="number" className="form-input" value={automation.fan_temp_high} onChange={af('fan_temp_high')} step="0.5" />
                  </div>
                  <div className="form-group">
                    <label>Mati saat suhu ≤ (°C)</label>
                    <input type="number" className="form-input" value={automation.fan_temp_normal} onChange={af('fan_temp_normal')} step="0.5" />
                  </div>
                </div>

                <button className="btn-primary" style={{ marginTop: 8 }} onClick={handleSaveAutomation} disabled={saving}>
                  <i className="fas fa-save" /> Simpan Pengaturan
                </button>
              </div>
            </div>
          )}

          {tab === 'tampilan' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Tampilan</span></div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Tema</div>
                    <div style={{ fontSize: '.83rem', color: 'var(--text-secondary)' }}>
                      Aktif: {theme === 'dark' ? 'Gelap' : 'Terang'}
                    </div>
                  </div>
                  <button className="btn-secondary" onClick={toggleTheme}>
                    <i className={`fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} />
                    {' '}{theme === 'dark' ? 'Ke Terang' : 'Ke Gelap'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
