import { useEffect, useState } from 'react';
import Dashboard from './components/Dashboard';
import { loadAppData } from './services/dataService';

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAppData().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="app-message error">Could not load dashboard data: {error}</div>;
  if (!data) return <div className="app-message">Loading dashboard data…</div>;
  return <Dashboard data={data} />;
}
