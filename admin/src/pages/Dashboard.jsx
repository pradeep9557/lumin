import { useState, useEffect } from 'react';
import { getStats } from '../api';

function StatCard({ label, value, accent }) {
  return (
    <div className={`stat-card ${accent || ''}`}>
      <div className="stat-value">{value ?? '—'}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getStats().then(setStats).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        <StatCard label="Total Users" value={stats.totalUsers} accent="purple" />
        <StatCard label="Active Users" value={stats.activeUsers} accent="green" />
        <StatCard label="Disabled Users" value={stats.disabledUsers} accent="red" />
        <StatCard label="New This Week" value={stats.newUsersThisWeek} accent="blue" />
        <StatCard label="FAQs" value={stats.totalFaqs} />
        <StatCard label="Herbs" value={stats.totalHerbs} />
        <StatCard label="Crystals" value={stats.totalCrystals} />
        <StatCard label="Pages" value={stats.totalPages} />
      </div>
    </div>
  );
}
