'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

type ActivityEntry = {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  category: 'system' | 'user' | 'billing' | 'security' | 'data';
  severity: 'info' | 'warning' | 'error' | 'success';
};

const MOCK_ACTIVITY: ActivityEntry[] = Array.from({ length: 50 }, (_, i) => {
  const actions = ['Created item', 'Updated settings', 'Exported data', 'Deleted record', 'API key generated',
    'User invited', 'Webhook triggered', 'Login detected', 'Plan upgraded', 'Data import completed',
    'Alert acknowledged', 'Integration connected', 'Backup created', 'Password changed', 'Report generated'];
  const users = ['you', 'team@company.com', 'admin@company.com', 'system'];
  const categories: ActivityEntry['category'][] = ['system', 'user', 'billing', 'security', 'data'];
  const severities: ActivityEntry['severity'][] = ['info', 'info', 'info', 'success', 'warning', 'error'];
  const action = actions[i % actions.length];
  return {
    id: `act_${(1000 - i).toString().padStart(4, '0')}`,
    action,
    description: `${action} — ${['record #' + (100 + i), 'in workspace', 'via API', 'from dashboard'][i % 4]}`,
    user: users[i % users.length],
    timestamp: new Date(Date.now() - i * 3600000 * (1 + Math.random())).toISOString(),
    category: categories[i % categories.length],
    severity: severities[i % severities.length],
  };
});

export default function ActivityLogPage() {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 15;

  const filtered = useMemo(() => {
    return MOCK_ACTIVITY.filter(a => {
      if (filter !== 'all' && a.category !== filter) return false;
      if (search && !a.description.toLowerCase().includes(search.toLowerCase()) && !a.action.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [filter, search]);

  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const severityColors = { info: 'bg-gray-100 text-gray-700', warning: 'bg-yellow-50 text-yellow-700', error: 'bg-red-50 text-red-700', success: 'bg-green-50 text-green-700' };
  const categoryColors = { system: '🔧', user: '👤', billing: '💳', security: '🔒', data: '📊' };

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 3600000) return Math.round(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.round(diff / 3600000) + 'h ago';
    return Math.round(diff / 86400000) + 'd ago';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <h1 className="font-bold">Activity Log</h1>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{filtered.length} events</span>
        </div>
        <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Export Log</button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-black" placeholder="Search activity..." />
          <div className="flex gap-1 bg-white rounded-lg border p-1">
            {['all', 'system', 'user', 'billing', 'security', 'data'].map(cat => (
              <button key={cat} onClick={() => { setFilter(cat); setPage(1); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${filter === cat ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                {cat === 'all' ? 'All' : (categoryColors[cat as keyof typeof categoryColors] || '') + ' ' + cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Activity list */}
        <div className="bg-white rounded-xl border divide-y">
          {paged.map(entry => (
            <div key={entry.id} className="px-5 py-3 flex items-center gap-4 hover:bg-gray-50">
              <span className="text-lg">{categoryColors[entry.category]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{entry.action}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${severityColors[entry.severity]}`}>{entry.severity}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{entry.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">{entry.user}</p>
                <p className="text-xs text-gray-400">{formatTime(entry.timestamp)}</p>
              </div>
            </div>
          ))}
          {paged.length === 0 && (
            <div className="px-5 py-12 text-center text-gray-500 text-sm">No activity matches your filters</div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">← Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
