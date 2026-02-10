'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function BuildPageInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [idea, setIdea] = useState('');
  const [budget, setBudget] = useState('pro');
  const [timeline, setTimeline] = useState('asap');
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Prefill from Guardian email CTA
  useEffect(() => {
    if (params.get('idea')) setIdea(decodeURIComponent(params.get('idea')!));
    if (params.get('email')) setEmail(decodeURIComponent(params.get('email')!));
    if (params.get('verdict')) {
      const v = params.get('verdict');
      const c = params.get('confidence');
      setContext(`Guardian Verdict: ${v} (${c}% confidence)`);
    }
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, idea, budget, timeline, additionalContext: context }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-3xl font-bold mb-4">We&apos;re on it.</h1>
        <p className="text-gray-400 text-lg mb-8">
          Your build request has been received. We&apos;ll review your idea against our validation pipeline
          and get back to you within 24 hours with a scope, timeline, and quote.
        </p>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-left mb-8">
          <h3 className="font-semibold mb-3">What happens next:</h3>
          <ol className="space-y-2 text-gray-400 text-sm">
            <li className="flex gap-3"><span className="text-green-400 font-bold">1.</span> Our Guardian AI validates your idea against 1,310+ failure patterns</li>
            <li className="flex gap-3"><span className="text-green-400 font-bold">2.</span> SpecWriter generates a detailed technical specification</li>
            <li className="flex gap-3"><span className="text-green-400 font-bold">3.</span> We send you a quote with scope, timeline, and PFI target score</li>
            <li className="flex gap-3"><span className="text-green-400 font-bold">4.</span> Upon approval, our factory builds your product (typical: 3-7 days)</li>
            <li className="flex gap-3"><span className="text-green-400 font-bold">5.</span> CodeBreaker agent stress-tests before delivery</li>
          </ol>
        </div>
        <Link href="/" className="text-green-400 hover:underline">← Back to VaaS</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <Link href="/" className="text-green-400 hover:underline text-sm mb-8 inline-block">← Back to VaaS</Link>
      
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Let us <span className="text-green-400">build it</span> for you.
        </h1>
        <p className="text-lg text-gray-400 max-w-xl mx-auto">
          Your idea passed validation? Our AI factory produces production-grade SaaS apps
          with auth, billing, and infrastructure — in days, not months.
        </p>
      </section>

      {/* What you get */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <Feature icon="🔐" title="Auth & Security" desc="Login, signup, password reset, rate limiting, security headers" />
        <Feature icon="💳" title="Billing & Payments" desc="Stripe integration, webhooks, subscription lifecycle, dunning" />
        <Feature icon="🗄️" title="Database & API" desc="Neon Postgres, Drizzle ORM, REST/GraphQL endpoints" />
        <Feature icon="🚀" title="Deployed & Live" desc="Vercel hosting, custom domain, CI/CD from GitHub" />
        <Feature icon="🧪" title="Adversarial Tested" desc="CodeBreaker agent stress-tests every feature before delivery" />
        <Feature icon="📊" title="PFI Scored" desc="Every product ships with a 100-point quality score and improvement roadmap" />
      </section>

      {/* Pricing tiers */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <BuildTier
          name="Starter"
          price="$499"
          desc="Simple SaaS MVP"
          features={['Landing page', 'Auth (email/password)', 'Core feature (1 module)', 'Stripe billing', 'Vercel deploy', 'PFI 65+ guaranteed']}
          selected={budget === 'starter'}
          onSelect={() => setBudget('starter')}
        />
        <BuildTier
          name="Pro"
          price="$1,499"
          desc="Production-ready app"
          features={['Everything in Starter', 'Dashboard + settings', '3-5 core features', 'Admin panel', 'Email notifications', 'PFI 75+ guaranteed', 'Custom domain setup']}
          selected={budget === 'pro'}
          onSelect={() => setBudget('pro')}
          highlight
        />
        <BuildTier
          name="Enterprise"
          price="$4,999"
          desc="Full platform"
          features={['Everything in Pro', 'Multi-tenant architecture', 'API + webhooks', 'Analytics dashboard', 'Custom integrations', 'PFI 80+ guaranteed', 'Dedicated support', '30-day warranty']}
          selected={budget === 'enterprise'}
          onSelect={() => setBudget('enterprise')}
        />
      </section>

      {/* Form */}
      <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <h2 className="text-xl font-bold mb-6">Request a Build</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@company.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">What do you want built? *</label>
            <textarea
              value={idea}
              onChange={e => setIdea(e.target.value)}
              required
              placeholder="Describe your SaaS idea, target users, and key features..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[100px] resize-y"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Timeline</label>
              <select
                value={timeline}
                onChange={e => setTimeline(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="asap">ASAP (rush)</option>
                <option value="1week">Within a week</option>
                <option value="1month">Within a month</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Budget tier</label>
              <select
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="starter">Starter ($499)</option>
                <option value="pro">Pro ($1,499)</option>
                <option value="enterprise">Enterprise ($4,999)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Additional context (optional)</label>
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Existing competitors, tech preferences, specific integrations needed..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] resize-y"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !idea}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {loading ? 'Submitting...' : 'Request Build Quote'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            No commitment. We&apos;ll validate your idea and send a detailed quote within 24h.
          </p>
        </form>
      </section>

      {/* Trust */}
      <section className="mt-12 text-center">
        <p className="text-gray-500 text-sm mb-4">Every product built by Greenbelt&apos;s AI factory includes:</p>
        <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ Source code ownership</span>
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ GitHub repository</span>
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ Vercel deployment</span>
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ Neon database</span>
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ Stripe billing</span>
          <span className="bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">✓ PFI quality score</span>
        </div>
      </section>
    </main>
  );
}

export default function BuildPage() {
  return <Suspense fallback={null}><BuildPageInner /></Suspense>;
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-gray-500 text-xs">{desc}</p>
    </div>
  );
}

function BuildTier({ name, price, desc, features, selected, onSelect, highlight }: {
  name: string; price: string; desc: string; features: string[];
  selected: boolean; onSelect: () => void; highlight?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-xl p-5 border transition-all ${
        selected
          ? 'border-green-500 bg-green-500/5 ring-1 ring-green-500/30'
          : highlight
            ? 'border-gray-700 bg-gray-900 hover:border-gray-600'
            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
      }`}
    >
      {highlight && <div className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-1">Most Popular</div>}
      <h3 className="font-bold text-lg">{name}</h3>
      <div className="text-2xl font-bold text-green-400 mb-1">{price}</div>
      <p className="text-gray-500 text-xs mb-3">{desc}</p>
      <ul className="space-y-1">
        {features.map((f, i) => (
          <li key={i} className="text-gray-400 text-xs flex gap-1.5">
            <span className="text-green-400">✓</span> {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
