import { useEffect, useRef } from 'react'
import { useCamera } from '../hooks/useCamera'

export default function Camera() {
  const {
    active, devices, selectedDeviceId, setSelectedDeviceId,
    personCount, brightness, lightCondition,
    videoRef, loadDevices, startCamera, stopCamera,
  } = useCamera()

  useEffect(() => { loadDevices() }, [loadDevices])

  const condLabel = { dark: 'Gelap', normal: 'Normal', bright: 'Terang' }
  const condColor = { dark: '#3b82f6', normal: '#10b981', bright: '#f59e0b' }

  return (
    <div className="view" id="camera">
      <div className="view-header">
        <div className="v-title">
          <h3><i className="fas fa-eye" /> Computer Vision</h3>
          <p>Deteksi kehadiran orang dan kondisi cahaya secara real-time.</p>
        </div>
        <div className="v-actions">
          {active
            ? <button className="btn-danger" onClick={stopCamera}><i className="fas fa-stop" /> Stop Kamera</button>
            : <button className="btn-primary" onClick={() => startCamera(selectedDeviceId)}><i className="fas fa-video" /> Mulai Kamera</button>
          }
        </div>
      </div>

      <div className="camera-layout">
        {/* Video Preview */}
        <div className="camera-main">
          <div className="camera-focus-container" id="cameraFocusContainer" style={{ position: 'relative', background: '#000', borderRadius: 12, overflow: 'hidden', minHeight: 320 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: active ? 'block' : 'none' }}
            />
            {!active && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, color: '#64748b' }}>
                <i className="fas fa-video-slash" style={{ fontSize: 40, marginBottom: 12 }} />
                <p>Preview kamera nonaktif</p>
                <p style={{ fontSize: '.8rem', marginTop: 4 }}>Klik "Mulai Kamera" untuk memulai</p>
              </div>
            )}
          </div>

          {/* Kamera Selector */}
          {devices.length > 1 && (
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Pilih Kamera</label>
              <select className="form-input" value={selectedDeviceId || ''} onChange={e => setSelectedDeviceId(e.target.value)}>
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label || `Kamera ${d.deviceId.slice(0, 8)}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CV Stats Sidebar */}
        <div className="camera-side">
          <div className="card">
            <div className="card-header">
              <span className="card-title"><i className="fas fa-chart-line" /> Status Deteksi</span>
            </div>
            <div className="card-body">
              <div className="cv-stat-row">
                <span className="cv-stat-label">Status Kamera</span>
                <span className={`cv-badge${active ? ' active' : ''}`}>
                  {active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <div className="cv-stat-row">
                <span className="cv-stat-label">Orang Terdeteksi</span>
                <span className="cv-stat-val" id="cvHumanCount" style={{ color: personCount > 0 ? '#10b981' : 'inherit' }}>
                  {personCount}
                </span>
              </div>

              <div className="cv-stat-row">
                <span className="cv-stat-label">Kecerahan</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span id="cvBrightnessLabel">{Math.round(brightness * 100)}%</span>
                    <span id="cvLightCondition" style={{ color: condColor[lightCondition] }}>
                      {condLabel[lightCondition] || 'Memindai...'}
                    </span>
                  </div>
                  <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
                    <div id="cvBrightnessBar" style={{ width: `${Math.round(brightness * 100)}%`, height: '100%', background: condColor[lightCondition] || '#64748b', borderRadius: 4, transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="card-header">
              <span className="card-title"><i className="fas fa-info-circle" /> Info</span>
            </div>
            <div className="card-body" style={{ fontSize: '.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <p>Computer Vision menggunakan model COCO-SSD untuk mendeteksi kehadiran orang secara real-time.</p>
              <p style={{ marginTop: 8 }}>Hasil deteksi dipakai untuk menjalankan aturan otomasi (nyalakan lampu saat ada orang, dsb).</p>
              <p style={{ marginTop: 8 }}>Konfigurasi aturan CV tersedia di halaman <strong>Pengaturan</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
