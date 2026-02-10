'use client';

import { useState } from 'react';

const SKILL_OPTIONS = [
  'Full-stack development', 'Mobile development', 'Data science / ML',
  'Design / UX', 'Marketing / Growth', 'Sales / Business development',
  'DevOps / Infrastructure', 'Content creation', 'E-commerce',
  'Finance / Accounting', 'Healthcare', 'Education',
  'Real estate', 'Construction', 'Food & beverage', 'Other'
];

const BUDGET_OPTIONS = [
  { value: 'bootstrap', label: '$0 – $500 (Bootstrap)' },
  { value: 'small', label: '$500 – $5,000' },
  { value: 'medium', label: '$5,000 – $25,000' },
  { value: 'large', label: '$25,000+' },
];

const TIMELINE_OPTIONS = [
  { value: 'weekend', label: 'Weekend project' },
  { value: '1month', label: '1 month' },
  { value: '3months', label: '3 months' },
  { value: '6months', label: '6+ months' },
];

export default function GeneratePage() {
  const [skills, setSkills] = useState<string[]>([]);
  const [budget, setBudget] = useState('bootstrap');
  const [timeline, setTimeline] = useState('1month');
  const [interests, setInterests] = useState('');
  const [avoid, setAvoid] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [error, setError] = useState('');

  function toggleSkill(s: string) {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (skills.length === 0) { setError('Select at least one skill'); return; }
    setLoading(true); setError(''); setIdeas([]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills, budget, timeline, interests, avoid }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      setIdeas(data.ideas || []);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <nav className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <a href="/" className="text-gray-500 hover:text-white text-sm">← Back to VaaS</a>
        <span className="text-xl font-bold">💡 Idea Generator</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6">
        <section className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            Don&apos;t have an idea?<br />
            <span className="text-green-400">We&apos;ll find one for you.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            Tell us your skills, budget, and timeline. Our AI generates 5 validated concepts — 
            pre-screened against 1,310+ startup failures so you don&apos;t build something doomed.
          </p>
        </section>

        <form onSubmit={handleGenerate} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 mb-12">
          {/* Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">Your skills & experience *</label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                    skills.includes(s) 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Budget & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Starting budget</label>
              <select value={budget} onChange={e => setBudget(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100">
                {BUDGET_OPTIONS.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Timeline to launch</label>
              <select value={timeline} onChange={e => setTimeline(e.target.value)}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100">
                {TIMELINE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Interests & Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Industries or topics you&apos;re drawn to</label>
              <input type="text" value={interests} onChange={e => setInterests(e.target.value)}
                placeholder="e.g. restaurants, fitness, developer tools"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Anything to avoid?</label>
              <input type="text" value={avoid} onChange={e => setAvoid(e.target.value)}
                placeholder="e.g. crypto, social media, B2C"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600" />
            </div>
          </div>

          <button type="submit" disabled={loading || skills.length === 0}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generating ideas (10-20 seconds)...
              </span>
            ) : 'Generate 5 Validated Ideas'}
          </button>
        </form>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-red-400">{error}</div>}

        {/* Results */}
        {ideas.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-6">Your personalized ideas</h2>
            <div className="space-y-6">
              {ideas.map((idea, i) => (
                <div key={i} className="bg-gray-900/80 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{idea.name}</h3>
                      <span className="text-xs text-gray-500">{idea.category} · {idea.revenueModel}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      idea.confidence >= 70 ? 'bg-green-500/10 text-green-400' :
                      idea.confidence >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {idea.confidence}% fit
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">{idea.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-500">Audience</div>
                      <div className="text-gray-300">{idea.audience}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-500">Pricing</div>
                      <div className="text-gray-300">{idea.pricing}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-500">Competition</div>
                      <div className="text-gray-300">{idea.competitionLevel}</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-2">
                      <div className="text-gray-500">Time to MVP</div>
                      <div className="text-gray-300">{idea.timeToMvp}</div>
                    </div>
                  </div>

                  {idea.whyItWorks && (
                    <p className="text-green-400/80 text-sm mb-3">💡 {idea.whyItWorks}</p>
                  )}
                  {idea.biggestRisk && (
                    <p className="text-red-400/80 text-sm mb-4">⚠️ {idea.biggestRisk}</p>
                  )}

                  <a href={`/?idea=${encodeURIComponent(idea.name + ': ' + idea.description)}&audience=${encodeURIComponent(idea.audience)}`}
                    className="inline-block bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Validate This Idea →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
