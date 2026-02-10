'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function CheckoutBannerInner() {
  const params = useSearchParams();
  const checkout = params.get('checkout');
  if (!checkout) return null;
  
  if (checkout === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8 text-green-400 text-center">
        🎉 Welcome to VaaS Pro! Your subscription is active. Unlimited validations unlocked.
      </div>
    );
  }
  if (checkout === 'cancelled') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8 text-yellow-400 text-center">
        Checkout cancelled. No charge was made. You can upgrade anytime.
      </div>
    );
  }
  return null;
}

function CheckoutBanner() {
  return <Suspense fallback={null}><CheckoutBannerInner /></Suspense>;
}

export default function Home() {
  const [idea, setIdea] = useState('');
  const [audience, setAudience] = useState('');
  const [model, setModel] = useState('subscription');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, audience, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <CheckoutBanner />
      {/* Hero */}
      <section className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-6">
          Powered by 1,310+ startup failure patterns
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Stop building products<br />
          <span className="text-green-400">nobody wants.</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          VaaS runs your SaaS idea through an adversarial AI pipeline that&apos;s analyzed thousands of startups.
          Get a brutally honest validation report in 60 seconds.
        </p>
      </section>

      {/* Form */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 mb-12">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">
              Describe your SaaS idea *
            </label>
            <textarea
              id="idea"
              value={idea}
              onChange={e => setIdea(e.target.value)}
              placeholder="e.g. An AI-powered tool that helps restaurants instantly find replacement staff when someone calls out sick. Plugin for 7shifts/Toast..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[120px] resize-y"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-2">
                Target audience
              </label>
              <input
                id="audience"
                type="text"
                value={audience}
                onChange={e => setAudience(e.target.value)}
                placeholder="e.g. Restaurant managers with 20+ staff"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
                Revenue model
              </label>
              <select
                id="model"
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="subscription">Subscription (SaaS)</option>
                <option value="freemium">Freemium</option>
                <option value="one_time">One-time purchase</option>
                <option value="usage_based">Usage-based</option>
                <option value="marketplace_app">Marketplace app</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !idea.trim()}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running adversarial validation...
              </span>
            ) : (
              'Validate My Idea — Free'
            )}
          </button>
        </form>
      </section>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && <ValidationReport report={result} />}

      {/* Social Proof */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <Stat value="1,310+" label="Startup failures analyzed" />
        <Stat value="35" label="Quality criteria scored" />
        <Stat value="< 60s" label="Average validation time" />
      </section>

      {/* How it works */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Step num={1} title="Submit your idea" desc="Describe what you want to build, who it's for, and how it makes money." />
          <Step num={2} title="Guardian tries to kill it" desc="Our adversarial AI agent matches your idea against 1,310+ failure patterns from real startups." />
          <Step num={3} title="Get your report" desc="Confidence score, risk factors, competitive analysis, and specific recommendations." />
        </div>
      </section>

      {/* Pricing */}
      <section className="mt-20" id="pricing">
        <h2 className="text-2xl font-bold text-center mb-10">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PriceCard
            tier="Free"
            price="$0"
            period=""
            features={['5 validations/hour', 'Confidence score', 'Risk breakdown', 'Category detection']}
            cta="Start Free"
            highlight={false}
          />
          <PriceCard
            tier="Pro"
            price="$29"
            period="/mo"
            features={['Unlimited validations', 'Full adversarial report', 'Competitive analysis', 'PDF export', 'API access']}
            cta="Subscribe to Pro"
            highlight={true}
            plan="pro"
          />
          <PriceCard
            tier="Enterprise"
            price="$199"
            period="/mo"
            features={['Everything in Pro', 'Batch validation (CSV)', 'Custom failure patterns', 'Team collaboration', 'Priority support']}
            cta="Subscribe to Enterprise"
            highlight={false}
            plan="enterprise"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-20 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>VaaS by <a href="https://projectgreenbelt.com" className="text-green-400 hover:underline">Greenbelt</a> — The Moody&apos;s of AI-generated products.</p>
      </footer>
    </main>
  );
}

function ValidationReport({ report }: { report: any }) {
  const score = report.confidence ?? 0;
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = score >= 70 ? 'bg-green-500/10 border-green-500/20' : score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className={`border rounded-2xl p-8 ${bgColor}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Validation Report</h2>
        <div className={`text-4xl font-bold ${color}`}>{score}%</div>
      </div>

      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">{report.verdict}</h3>
        <p className="text-gray-300">{report.summary}</p>
      </div>

      {report.risks && report.risks.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-red-400">⚠️ Risk Factors</h3>
          <ul className="space-y-2">
            {report.risks.map((risk: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-red-400 mt-1">•</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.strengths && report.strengths.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-green-400">✅ Strengths</h3>
          <ul className="space-y-2">
            {report.strengths.map((s: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-green-400 mt-1">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {report.recommendations && report.recommendations.length > 0 && (
        <div>
          <h3 className="font-semibold text-lg mb-2 text-blue-400">💡 Recommendations</h3>
          <ul className="space-y-2">
            {report.recommendations.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <span className="text-blue-400 mt-1">•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between text-sm text-gray-500">
        <span>Scored against {report.patternsMatched ?? 0} failure patterns</span>
        <span>Powered by Greenbelt Guardian</span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-6 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="text-3xl font-bold text-green-400 mb-1">{value}</div>
      <div className="text-gray-400 text-sm">{label}</div>
    </div>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-green-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
        {num}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{desc}</p>
    </div>
  );
}

function PriceCard({ tier, price, period, features, cta, highlight, plan }: {
  tier: string; price: string; period: string; features: string[]; cta: string; highlight: boolean; plan?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!plan) return; // Free tier — no checkout
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl p-6 border ${highlight ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/20' : 'border-gray-800 bg-gray-900'}`}>
      {highlight && <div className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">Most Popular</div>}
      <h3 className="text-xl font-bold mb-2">{tier}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-gray-500">{period}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-gray-300 text-sm">
            <span className="text-green-400">✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
          highlight ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}
      >
        {loading ? 'Redirecting...' : cta}
      </button>
    </div>
  );
}
