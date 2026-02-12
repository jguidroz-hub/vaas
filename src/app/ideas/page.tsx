'use client';

import { useEffect, useState } from 'react';

export default function IdeasPage() {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/ideas')
      .then(r => r.json())
      .then(data => { setIdeas(data.ideas || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = ['all', ...new Set(ideas.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'all' ? ideas : ideas.filter(i => i.category === filter);

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-gray-500 hover:text-white text-sm">← Back to VaaS</a>
        <span className="text-xl font-bold">📚 Idea Library</span>
      </nav>

      <div className="max-w-5xl mx-auto px-6">
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            Validated ideas.<br />
            <span className="text-green-400">Free to explore.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Anonymized summaries of validated ideas, scored by our AI. 
            Only ideas scoring 60%+ confidence make it here.
          </p>
          
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  filter === c ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}>
                {c === 'all' ? 'All' : c}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading ideas...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-lg mb-4">No ideas yet.</p>
            <p className="text-sm">Be the first — <a href="/" className="text-green-400 hover:underline">validate your idea</a> and it may appear here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {filtered.map((idea, i) => (
              <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {idea.category && (
                      <span className="text-xs text-gray-500 uppercase tracking-wider">{idea.category}</span>
                    )}
                    <h3 className="text-lg font-bold mt-1">{idea.idea}</h3>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ml-3 shrink-0 ${
                    idea.confidence >= 75 ? 'bg-green-500/10 text-green-400' :
                    idea.confidence >= 60 ? 'bg-yellow-500/10 text-yellow-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {idea.confidence}%
                  </div>
                </div>

                {/* Audience removed for anonymity */}

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span>{idea.revenue_model || idea.revenueModel}</span>
                  {idea.ecosystem && <><span>·</span><span>{idea.ecosystem}</span></>}
                  <span>·</span>
                  <span>{new Date(idea.created_at || idea.createdAt).toLocaleDateString()}</span>
                </div>

                {idea.verdict && (
                  <div className={`mt-3 text-xs font-medium ${
                    idea.verdict.includes('STRONG') ? 'text-green-400' :
                    idea.verdict.includes('CONDITIONAL') ? 'text-yellow-400' :
                    'text-gray-400'
                  }`}>
                    {idea.verdict.replace(/_/g, ' ')}
                  </div>
                )}

                <a href="/"
                  className="inline-block mt-4 text-green-400 hover:text-green-300 text-sm font-medium">
                  Run your own validation →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
