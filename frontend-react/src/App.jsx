import { useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const MENU = [
  { key: 'dashboard', label: 'Dashboard', endpoint: '/api/dashboard' },
  { key: 'devices', label: 'Devices', endpoint: '/api/devices' },
  { key: 'sensors', label: 'Sensors', endpoint: '/api/sensors' },
  { key: 'automation', label: 'Automation', endpoint: '/api/automation' },
  { key: 'settings', label: 'Settings', endpoint: '/api/settings' },
];

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const current = useMemo(() => MENU.find((m) => m.key === active) || MENU[0], [active]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_BASE}${current.endpoint}?userId=1`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setPayload(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch API');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [current.endpoint]);

  const renderDashboard = () => {
    if (!payload?.stats) return null;

    return (
      <ul>
        <li>Total Device: <strong>{payload.stats.totalDevices}</strong></li>
        <li>Device Aktif: <strong>{payload.stats.activeDevices}</strong></li>
        <li>Total Sensor: <strong>{payload.stats.totalSensors}</strong></li>
      </ul>
    );
  };

  const renderItems = () => {
    if (payload?.item) {
      return <pre>{JSON.stringify(payload.item, null, 2)}</pre>;
    }

    const items = Array.isArray(payload?.items) ? payload.items : [];

    if (items.length === 0) {
      return <p className="empty">Data kosong.</p>;
    }

    return (
      <ul>
        {items.map((item) => (
          <li key={item.id ?? item.device_key ?? item.sensor_key ?? JSON.stringify(item)}>
            <strong>{item.name || item.device_key || item.sensor_key || `Rule #${item.id}`}</strong>
            <span className="muted"> — {item.type || item.action || 'entry'}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>IoTzy React + PHP</h1>
        <span className="chip">Minimal · Smooth · Cepat</span>
      </header>

      <nav className="menu">
        {MENU.map((item) => (
          <button
            key={item.key}
            type="button"
            className={active === item.key ? 'menu-btn active' : 'menu-btn'}
            onClick={() => setActive(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="grid">
        <section className="card">
          <h2>{current.label}</h2>
          {loading && <p>Memuat data...</p>}
          {error && <p className="error">Error: {error}</p>}
          {!loading && !error && active === 'dashboard' && renderDashboard()}
          {!loading && !error && active !== 'dashboard' && renderItems()}
        </section>

        <section className="card">
          <h2>Koneksi</h2>
          <ul>
            <li>API Base: <code>{API_BASE}</code></li>
            <li>Endpoint aktif: <code>{current.endpoint}</code></li>
            <li>Status: <strong>{loading ? 'Loading' : error ? 'Error' : 'Connected'}</strong></li>
          </ul>
        </section>
      </main>
    </div>
  );
}
