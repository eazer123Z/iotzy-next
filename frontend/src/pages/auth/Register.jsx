import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiCall } from '../../lib/api'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', fullname: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await apiCall('register', form)
    setLoading(false)
    if (res?.success) navigate('/login')
    else setError(typeof res?.error === 'string' ? res.error : 'Gagal mendaftar')
  }

  const f = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><i className="fas fa-bolt" /></div>
        <h1 className="auth-title">IoTzy</h1>
        <p className="auth-sub">Buat akun baru</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Nama Lengkap</label>
            <input type="text" className="form-input" placeholder="Nama Lengkap"
              value={form.fullname} onChange={f('fullname')} required />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="form-input" placeholder="Username"
              value={form.username} onChange={f('username')} required autoFocus />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" className="form-input" placeholder="Email"
              value={form.email} onChange={f('email')} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" className="form-input" placeholder="Password"
              value={form.password} onChange={f('password')} required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? <><i className="fas fa-spinner fa-spin" /> Mendaftar...</> : 'Daftar'}
          </button>
        </form>

        <p className="auth-footer">
          Sudah punya akun? <Link to="/login">Masuk</Link>
        </p>
      </div>
    </div>
  )
}