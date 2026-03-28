/**
 * lib/cvConfig.js
 * Konfigurasi sensor types dan CV helpers — dipakai di hooks + pages
 */

export const SENSOR_CONFIG = {
  temperature: { icon: 'fa-temperature-half', color: '#f87171', min: 10, max: 40, unit: '°C' },
  humidity:    { icon: 'fa-droplet',          color: '#60a5fa', min: 0,  max: 100, unit: '%' },
  air_quality: { icon: 'fa-wind',             color: '#2dd4bf', min: 0,  max: 500, unit: 'AQI' },
  presence:    { icon: 'fa-user-check',       color: '#34d399', unit: '' },
  brightness:  { icon: 'fa-sun',             color: '#fbbf24', min: 0,  max: 1,   unit: '' },
  motion:      { icon: 'fa-person-running',   color: '#a78bfa', unit: '' },
  smoke:       { icon: 'fa-fire',             color: '#f87171', min: 0,  max: 300, unit: 'ppm' },
  gas:         { icon: 'fa-triangle-exclamation', color: '#fbbf24', min: 0, max: 1000, unit: 'ppm' },
}

export const SENSOR_LABELS = {
  temperature: 'Suhu', humidity: 'Kelembaban', air_quality: 'Kualitas Udara',
  presence: 'Kehadiran', brightness: 'Kecerahan', motion: 'Gerakan',
  smoke: 'Asap', gas: 'Gas',
}

export const DEVICE_ICONS = [
  { value: 'fa-lightbulb', label: 'Lampu' },
  { value: 'fa-wind',      label: 'Kipas' },
  { value: 'fa-snowflake', label: 'AC' },
  { value: 'fa-tv',        label: 'TV' },
  { value: 'fa-lock',      label: 'Kunci' },
  { value: 'fa-video',     label: 'Kamera' },
  { value: 'fa-plug',      label: 'Stop Kontak' },
  { value: 'fa-door-open', label: 'Pintu' },
]

export function getDeviceType(icon = '') {
  const i = icon.toLowerCase()
  if (i.includes('lightbulb') || i.includes('bulb') || i.includes('lamp')) return 'light'
  if (i.includes('fan') || i.includes('wind')) return 'fan'
  if (i.includes('snowflake') || i.includes('ac')) return 'ac'
  if (i.includes('tv') || i.includes('display')) return 'tv'
  if (i.includes('lock') || i.includes('key')) return 'lock'
  if (i.includes('door')) return 'door'
  if (i.includes('video') || i.includes('camera')) return 'cctv'
  if (i.includes('volume') || i.includes('speaker')) return 'speaker'
  return 'switch'
}

export function getAQILabel(val) {
  if (val < 50)  return { label: 'Baik',        color: '#22c55e' }
  if (val < 100) return { label: 'Sedang',       color: '#eab308' }
  if (val < 150) return { label: 'Tidak Sehat',  color: '#f97316' }
  if (val < 200) return { label: 'Sangat Buruk', color: '#ef4444' }
  return           { label: 'Berbahaya',          color: '#7c3aed' }
}

export function formatDuration(ms) {
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}j ${m}m`
  if (m > 0) return `${m}m ${s}d`
  return `${s}d`
}
