'use client';

import { useEffect, useState } from 'react';

export default function TrendsPage() {
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/trends')
      .then(r => r.json())
      .then(data => { setTrends(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-gray-500 hover:text-white text-sm">← Back to VaaS</a>
        <span className="text-xl font-bold">📈 Trend Dashboard</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            What founders are<br />
            <span className="text-green-400">thinking about.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Real-time signal from ideas submitted to VaaS. See what categories are trending, 
            what&apos;s getting validated, and where the opportunities are.
          </p>
        </section>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading trends...</div>
        ) : !trends || trends.totalSubmissions === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg mb-4">Not enough data yet.</p>
            <p className="text-sm">As more founders validate ideas, trends will emerge. <a href="/" className="text-green-400 hover:underline">Be the first →</a></p>
          </div>
        ) : (
          <div className="space-y-8 mb-16">
            {/* Stats bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white">{trends.totalSubmissions}</div>
                <div className="text-gray-500 text-sm">Ideas validated</div>
              </div>
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-400">{trends.avgConfidence}%</div>
                <div className="text-gray-500 text-sm">Avg confidence</div>
              </div>
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-purple-400">{trends.topCategories?.length || 0}</div>
                <div className="text-gray-500 text-sm">Categories</div>
              </div>
              <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400">{trends.highConfidenceCount}</div>
                <div className="text-gray-500 text-sm">Strong ideas (70%+)</div>
              </div>
            </div>

            {/* Top categories */}
            {trends.topCategories?.length > 0 && (
              <section className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6">🔥 Trending Categories</h2>
                <div className="space-y-4">
                  {trends.topCategories.map((cat: any, i: number) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 text-right text-gray-500 text-sm font-mono">#{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{cat.category || 'Uncategorized'}</span>
                          <span className="text-gray-400 text-sm">{cat.count} ideas · avg {cat.avgConfidence}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (cat.count / (trends.topCategories[0]?.count || 1)) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Top ecosystems */}
            {trends.topEcosystems?.length > 0 && (
              <section className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6">🌐 Platform Ecosystems</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {trends.topEcosystems.map((eco: any, i: number) => (
                    <div key={i} className="bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-lg font-bold text-green-400">{eco.count}</div>
                      <div className="text-gray-400 text-sm">{eco.ecosystem || 'Standalone'}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent high-scoring */}
            {trends.recentHighScoring?.length > 0 && (
              <section className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6">⭐ Recent High-Scoring Ideas</h2>
                <div className="space-y-3">
                  {trends.recentHighScoring.map((idea: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                        idea.confidence >= 75 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{idea.confidence}%</span>
                      <span className="text-gray-300 text-sm flex-1">{idea.idea}</span>
                      <span className="text-gray-500 text-xs">{idea.category}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
