export default function StatusPanel({ apiBase, endpoint, loading, error }) {
  return (
    <section className="card">
      <h2>Koneksi</h2>
      <ul>
        <li>API Base: <code>{apiBase}</code></li>
        <li>Endpoint aktif: <code>{endpoint}</code></li>
        <li>Status: <strong>{loading ? 'Loading' : error ? 'Error' : 'Connected'}</strong></li>
      </ul>
    </section>
  );
}
