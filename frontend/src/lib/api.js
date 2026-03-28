import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: `${API_URL}/api/index.php`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Inject CSRF token dari cookie/meta setiap request
api.interceptors.request.use((config) => {
  const csrf = sessionStorage.getItem('csrf_token')
  if (csrf) config.headers['X-CSRF-Token'] = csrf
  return config
})

// Handle 401 → redirect login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      sessionStorage.clear()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

/**
 * Wrapper utama — semua call pakai ini
 * apiCall('get_devices') atau apiCall('save_settings', { theme: 'dark' })
 */
export async function apiCall(action, data = {}) {
  try {
    const res = await api.post(`?action=${action}`, data)
    return res.data
  } catch (err) {
    const msg = err.response?.data?.error || err.message || 'Network error'
    return { success: false, error: msg }
  }
}

export default api
