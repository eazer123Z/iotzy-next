import { useMemo, useState, useEffect } from 'react';
import { MENU } from './data/menu';
import { fetchModule, getApiBase } from './services/api';
import Menu from './components/Menu';
import DataPanel from './components/DataPanel';
import StatusPanel from './components/StatusPanel';

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
        const json = await fetchModule(current.endpoint, 1);
        setPayload(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch API');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [current.endpoint]);

  return (
    <div className="page">
      <header className="topbar">
        <h1>IoTzy Web Platform</h1>
        <span className="chip">Enterprise-ready Foundation</span>
      </header>

      <Menu items={MENU} active={active} onChange={setActive} />

      <main className="grid">
        <DataPanel
          title={current.label}
          loading={loading}
          error={error}
          payload={payload}
          isDashboard={active === 'dashboard'}
        />
        <StatusPanel
          apiBase={getApiBase()}
          endpoint={current.endpoint}
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
}
