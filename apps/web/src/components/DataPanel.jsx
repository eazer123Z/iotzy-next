function DashboardView({ payload }) {
  if (!payload?.stats) return null;

  return (
    <ul>
      <li>Total Device: <strong>{payload.stats.totalDevices}</strong></li>
      <li>Device Aktif: <strong>{payload.stats.activeDevices}</strong></li>
      <li>Total Sensor: <strong>{payload.stats.totalSensors}</strong></li>
    </ul>
  );
}

function ListView({ payload }) {
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
}

export default function DataPanel({ title, loading, error, payload, isDashboard }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {loading && <p>Memuat data...</p>}
      {error && <p className="error">Error: {error}</p>}
      {!loading && !error && isDashboard && <DashboardView payload={payload} />}
      {!loading && !error && !isDashboard && <ListView payload={payload} />}
    </section>
  );
}
