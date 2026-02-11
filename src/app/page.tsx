'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ─── Checkout Banner ────────────────────────────────────────
function CheckoutBannerInner() {
  const params = useSearchParams();
  const checkout = params.get('checkout');
  const sessionId = params.get('session_id');

  useEffect(() => {
    // After successful checkout, retrieve customer email from session and auto-login
    // Webhook may take a few seconds to fire — retry up to 3 times
    if (checkout === 'success' && sessionId) {
      const tryAutoLogin = async (attempt = 1) => {
        try {
          const res = await fetch(`/api/checkout/success?session_id=${sessionId}`);
          const data = await res.json();
          if (data.email) {
            const authRes = await fetch('/api/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email }),
            });
            const authData = await authRes.json();
            if (authData.retryable && attempt < 4) {
              setTimeout(() => tryAutoLogin(attempt + 1), attempt * 3000);
            } else if (authData.codeSent) {
              // OTP sent — user needs to check email. Show hint.
            }
          }
        } catch {}
      };
      // First attempt after 2s (give webhook time to fire)
      setTimeout(() => tryAutoLogin(1), 2000);
    }
  }, [checkout, sessionId]);

  if (!checkout) return null;
  if (checkout === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-8 text-green-400 text-center">
        🎉 Subscription active. You&apos;re in.
      </div>
    );
  }
  if (checkout === 'cancelled') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-8 text-yellow-400 text-center">
        Checkout cancelled. No charge.
      </div>
    );
  }
  return null;
}

function CheckoutBanner() {
  return <Suspense fallback={null}><CheckoutBannerInner /></Suspense>;
}

// ─── Email Verification Login ───────────────────────────────
function SubscriberLogin() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [auth, setAuth] = useState<{ authenticated: boolean; email?: string; plan?: string } | null>(null);

  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(setAuth).catch(() => {});
  }, []);

  const refreshAuth = () => fetch('/api/auth').then(r => r.json()).then(setAuth).catch(() => {});

  if (auth?.authenticated) {
    const planLabel = auth.plan === 'enterprise' ? 'VENTURE VERDICT' : auth.plan === 'pro' ? 'GUARDIAN DEBATE' : (auth.plan?.toUpperCase() || 'FREE');
    return (
      <div className="text-sm text-gray-400 text-right">
        ✅ <span className="text-green-400">{planLabel}</span> — {auth.email}
      </div>
    );
  }

  const handleSendCode = async () => {
    setStatus('loading'); setErrorMsg('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok && data.codeSent) { setStep('code'); setStatus('idle'); }
      else { setErrorMsg(data.error || 'Not found'); setStatus('error'); }
    } catch { setErrorMsg('Network error'); setStatus('error'); }
  };

  const handleVerifyCode = async () => {
    setStatus('loading'); setErrorMsg('');
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
      const data = await res.json();
      if (res.ok && data.authenticated) { setStatus('idle'); refreshAuth(); }
      else { setErrorMsg(data.error || 'Invalid code'); setStatus('error'); }
    } catch { setErrorMsg('Network error'); setStatus('error'); }
  };

  if (step === 'code') {
    return (
      <div className="flex items-center gap-2 justify-end text-sm flex-wrap">
        <span className="text-gray-500">Code sent to {email}</span>
        <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456"
          className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 text-sm w-24 text-center tracking-widest" maxLength={6} autoFocus />
        <button onClick={handleVerifyCode} disabled={status === 'loading' || code.length !== 6}
          className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
          {status === 'loading' ? '...' : 'Verify'}
        </button>
        <button onClick={() => { setStep('email'); setCode(''); setErrorMsg(''); }} className="text-gray-500 hover:text-gray-300 text-xs">← Back</button>
        {errorMsg && <span className="text-red-400 text-xs">{errorMsg}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end text-sm flex-wrap">
      <span className="text-gray-500">Subscriber?</span>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"
        className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-100 text-sm w-48" />
      <button onClick={handleSendCode} disabled={status === 'loading' || !email.includes('@')}
        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
        {status === 'loading' ? '...' : 'Log In'}
      </button>
      {errorMsg && <span className="text-red-400 text-xs">{errorMsg}</span>}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
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
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/validate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idea, audience, model }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');
      setResult(data);
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Navigation */}
      <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">VaaS</span>
          <span className="text-xs text-gray-500 hidden sm:inline">by Greenbelt</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#compare" className="hover:text-white transition-colors">Compare</a>
          <a href="/generate" className="hover:text-white transition-colors">💡 Generate</a>
          <a href="/ideas" className="hover:text-white transition-colors">📚 Library</a>
          <a href="/trends" className="hover:text-white transition-colors">📈 Trends</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6">
        <SubscriberLogin />
        <CheckoutBanner />

        {/* ─── Hero ──────────────────────────────────────── */}
        <section className="text-center py-20">
          <div className="inline-block px-4 py-1.5 bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-purple-500/10 border border-green-500/20 rounded-full text-green-400 text-sm font-medium mb-8">
            ⚔️ Adversarial AI Validation · 1,310+ failure patterns
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Your idea gets a<br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">verdict, not a vibe check.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Builder AI defends your idea. Guardian AI tries to destroy it. Three rounds. One verdict.
            Based on 1,310+ real startup failures — not opinions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#validate" className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-all shadow-[0_0_30px_rgba(34,197,94,0.2)] hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]">
              Validate Your Idea — Free →
            </a>
            <a href="/generate" className="inline-block bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-4 px-8 rounded-xl text-lg transition-all border border-gray-700">
              💡 Don&apos;t have an idea?
            </a>
          </div>
        </section>

        {/* ─── Social Proof Bar ──────────────────────────── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-gray-800/50">
          <Stat value="1,310+" label="Startup failures analyzed" />
          <Stat value="30+" label="Failure patterns tested" />
          <Stat value="3" label="Adversarial debate rounds" />
          <Stat value="< 30s" label="Instant results" />
        </section>

        {/* ─── How It Works ──────────────────────────────── */}
        <section className="py-20" id="how-it-works">
          <h2 className="text-3xl font-bold text-center mb-4">Three ways to validate</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">Choose your depth. Every tier builds on the last.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center mb-6 text-2xl">⚡</div>
              <div className="text-green-400 text-sm font-medium mb-2">Quick Check · Free</div>
              <h3 className="text-xl font-bold mb-3">Instant pattern scan</h3>
              <p className="text-gray-400 text-sm mb-4">Your idea scored against 30 failure patterns in under 30 seconds. Confidence score, risks, and recommendations.</p>
              <div className="text-gray-500 text-xs">→ Results on screen instantly</div>
            </div>

            <div className="bg-gray-900/50 border border-green-500/30 rounded-2xl p-8 ring-1 ring-green-500/10 hover:border-green-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 text-2xl">⚔️</div>
              <div className="text-green-400 text-sm font-medium mb-2">Guardian Debate · $29/mo</div>
              <h3 className="text-xl font-bold mb-3">Put your idea on trial</h3>
              <p className="text-gray-400 text-sm mb-4">Builder AI defends your idea. Guardian AI attacks it. Three rounds of adversarial debate using real startup failure data.</p>
              <div className="text-gray-500 text-xs">→ Full report emailed in ~7 minutes</div>
            </div>

            <div className="bg-gray-900/50 border border-purple-500/30 rounded-2xl p-8 ring-1 ring-purple-500/10 hover:border-purple-500/50 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 text-2xl">🔬</div>
              <div className="text-purple-400 text-sm font-medium mb-2">Venture Verdict · $199/mo</div>
              <h3 className="text-xl font-bold mb-3">Know your market before you build</h3>
              <p className="text-gray-400 text-sm mb-4">Live market research via Perplexity. Competitor analysis. TAM/SAM/SOM sizing. Revenue model assessment. Then the full Guardian debate.</p>
              <div className="text-gray-500 text-xs">→ Complete research dossier emailed in ~12 minutes</div>
            </div>
          </div>
        </section>

        {/* ─── Validate Form ─────────────────────────────── */}
        <section className="py-16" id="validate">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-2">Test your idea</h2>
            <p className="text-gray-400 text-sm mb-6">Free instant results. Subscribers get the full Guardian debate or Venture Verdict emailed automatically.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="idea" className="block text-sm font-medium text-gray-300 mb-2">Describe your idea *</label>
                <textarea id="idea" value={idea} onChange={e => setIdea(e.target.value)}
                  placeholder="e.g. An AI tool that helps restaurants instantly find replacement staff when someone calls out sick..."
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent min-h-[120px] resize-y" required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="audience" className="block text-sm font-medium text-gray-300 mb-2">Target audience</label>
                  <input id="audience" type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. Restaurant managers with 20+ staff"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/50" />
                </div>
                <div>
                  <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">Revenue model</label>
                  <select id="model" value={model} onChange={e => setModel(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500/50">
                    <option value="subscription">Subscription (SaaS)</option>
                    <option value="freemium">Freemium</option>
                    <option value="one_time">One-time purchase</option>
                    <option value="usage_based">Usage-based</option>
                    <option value="marketplace_app">Marketplace app</option>
                  </select>
                </div>
              </div>
              <button type="submit" disabled={loading || !idea.trim()}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all text-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Running adversarial validation...
                  </span>
                ) : 'Validate My Idea — Free'}
              </button>
            </form>
          </div>
        </section>

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8 text-red-400 max-w-3xl mx-auto">{error}</div>}
        {result && <div className="max-w-3xl mx-auto"><ValidationReport report={result} /></div>}

        {/* ─── Comparison Chart ───────────────────────────── */}
        <section className="py-20" id="compare">
          <h2 className="text-3xl font-bold text-center mb-4">Compare plans</h2>
          <p className="text-gray-400 text-center mb-12">Every tier includes everything below it.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full max-w-4xl mx-auto text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Feature</th>
                  <th className="text-center py-4 px-4 text-white font-semibold">Quick Check<br /><span className="text-gray-500 font-normal text-xs">Free</span></th>
                  <th className="text-center py-4 px-4 text-green-400 font-semibold">Guardian Debate<br /><span className="text-gray-500 font-normal text-xs">$29/mo</span></th>
                  <th className="text-center py-4 px-4 text-purple-400 font-semibold">Venture Verdict<br /><span className="text-gray-500 font-normal text-xs">$199/mo</span></th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <CompareRow feature="Instant pattern matching" free="✅ 30 patterns" pro="✅ 30 patterns" enterprise="✅ 30 patterns" />
                <CompareRow feature="Confidence score & risks" free="✅" pro="✅" enterprise="✅" />
                <CompareRow feature="Instant validations" free="5/hour" pro="Unlimited" enterprise="Unlimited" />
                <CompareRow feature="Deep analyses" free="—" pro="30/month (5/day)" enterprise="50/month (10/day)" />
                <CompareRow feature="Builder vs Guardian debate" free="—" pro="✅ 3 rounds" enterprise="✅ 3 rounds" />
                <CompareRow feature="Graveyard matching" free="—" pro="✅ 1,310+ failures" enterprise="✅ 1,310+ failures" />
                <CompareRow feature="Report emailed to you" free="—" pro="✅ ~7 min" enterprise="✅ ~12 min" />
                <CompareRow feature="Perplexity market research" free="—" pro="—" enterprise="✅ Live data" />
                <CompareRow feature="TAM/SAM/SOM market sizing" free="—" pro="—" enterprise="✅" />
                <CompareRow feature="Competitor analysis" free="—" pro="—" enterprise="✅ With funding data" />
                <CompareRow feature="Revenue model assessment" free="—" pro="—" enterprise="✅" />
                <CompareRow feature="Unfair advantage analysis" free="—" pro="—" enterprise="✅" />
                <CompareRow feature="API access" free="—" pro="✅" enterprise="✅" />
                <CompareRow feature="Email verification" free="Not required" pro="✅ Secure" enterprise="✅ Secure" />
                <CompareRow feature="Annual pricing" free="—" pro="$249/yr (save 28%)" enterprise="$1,499/yr (save 37%)" />
                <CompareRow feature="Per-report option" free="—" pro="$14.99 one-time" enterprise="$49.99 one-time" />
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Pricing ───────────────────────────────────── */}
        <section className="py-20" id="pricing">
          <PricingSection />
        </section>

        {/* ─── Build with Greenbelt ──────────────────────── */}
        <section className="py-20">
          <div className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 border border-green-500/20 rounded-2xl p-12 max-w-4xl mx-auto text-center">
            <div className="inline-block px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-green-400 text-xs font-medium mb-6">
              READY TO BUILD?
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Idea validated? <span className="text-green-400">Let Greenbelt build it.</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
              Our AI factory has shipped 30+ production-grade apps. Same adversarial validation that tested your idea 
              now quality-scores every line of code. From validated idea to deployed SaaS — without writing code yourself.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 text-left">
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">🏗️</div>
                <h3 className="font-semibold mb-1">Starter — $499</h3>
                <p className="text-gray-400 text-sm">Branded landing page, email capture, analytics. Deployed in 48 hours.</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="font-semibold mb-1">Pro Build — $1,499</h3>
                <p className="text-gray-400 text-sm">Full MVP with auth, billing, admin dashboard. Custom domain + hosting.</p>
              </div>
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="text-2xl mb-3">👑</div>
                <h3 className="font-semibold mb-1">Enterprise — $4,999</h3>
                <p className="text-gray-400 text-sm">Production SaaS with marketplace integrations, API layer, 3 months support.</p>
              </div>
            </div>

            <a href="/build" className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              Tell Us What to Build →
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Or explore <a href="https://projectgreenbelt.com" className="text-green-400 hover:underline">projectgreenbelt.com</a> to see what we&apos;ve shipped.
            </p>
          </div>
        </section>

        {/* ─── Footer ────────────────────────────────────── */}
        <footer className="py-12 border-t border-gray-800/50 text-center">
          <p className="text-gray-500 text-sm">
            VaaS by <a href="https://projectgreenbelt.com" className="text-green-400 hover:underline">Greenbelt</a> — Validation-as-a-Service for founders who want truth, not comfort.
          </p>
        </footer>
      </div>
    </main>
  );
}

// ─── Components ─────────────────────────────────────────────

function ValidationReport({ report }: { report: any }) {
  const score = report.confidence ?? 0;
  const color = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400';
  const bgColor = score >= 70 ? 'bg-green-500/10 border-green-500/20' : score >= 40 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <div className={`border rounded-2xl p-8 mb-12 ${bgColor}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Validation Report</h2>
        <div className={`text-4xl font-bold ${color}`}>{score}%</div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-2">{report.verdict}</h3>
        <p className="text-gray-300">{report.summary}</p>
      </div>
      {report.risks?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-red-400">⚠️ Risk Factors</h3>
          <ul className="space-y-2">{report.risks.map((r: string, i: number) => <li key={i} className="flex items-start gap-2 text-gray-300"><span className="text-red-400 mt-1">•</span>{r}</li>)}</ul>
        </div>
      )}
      {report.strengths?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-green-400">✅ Strengths</h3>
          <ul className="space-y-2">{report.strengths.map((s: string, i: number) => <li key={i} className="flex items-start gap-2 text-gray-300"><span className="text-green-400 mt-1">•</span>{s}</li>)}</ul>
        </div>
      )}
      {report.recommendations?.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-2 text-blue-400">💡 Recommendations</h3>
          <ul className="space-y-2">{report.recommendations.map((r: string, i: number) => <li key={i} className="flex items-start gap-2 text-gray-300"><span className="text-blue-400 mt-1">•</span>{r}</li>)}</ul>
        </div>
      )}

      {/* Deep Validation Status */}
      {report.deepValidation && (
        <div className={`mt-6 p-4 rounded-xl border ${report.deepValidation.status === 'running' ? 'bg-purple-500/10 border-purple-500/20' : report.deepValidation.status === 'limit_reached' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
          {report.deepValidation.status === 'running' ? (
            <div className="flex items-center gap-3">
              <div className="animate-pulse text-purple-400 text-xl">⚔️</div>
              <div>
                <p className="text-purple-300 font-medium">{report.deepValidation.tier === 'enterprise' ? 'Venture Verdict' : 'Guardian Debate'} in progress</p>
                <p className="text-gray-400 text-sm">{report.deepValidation.message}</p>
              </div>
            </div>
          ) : report.deepValidation.status === 'limit_reached' ? (
            <div className="flex items-center gap-3">
              <div className="text-yellow-400 text-xl">⚠️</div>
              <div>
                <p className="text-yellow-300 font-medium">Usage limit reached</p>
                <p className="text-gray-400 text-sm">{report.deepValidation.message}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-gray-300 text-sm mb-2">Want deeper analysis?</p>
              <a href="#pricing" className="text-green-400 hover:underline text-sm font-medium">Upgrade to Guardian Debate or Venture Verdict →</a>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-700/30 flex items-center justify-between text-sm text-gray-500">
        <span>Scored against {report.patternsMatched ?? 0} failure patterns</span>
        <span>Powered by Greenbelt Guardian</span>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center py-4">
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-gray-500 text-xs uppercase tracking-wider">{label}</div>
    </div>
  );
}

function CompareRow({ feature, free, pro, enterprise }: { feature: string; free: string; pro: string; enterprise: string }) {
  return (
    <tr className="border-b border-gray-800/50">
      <td className="py-3 px-4 text-gray-300">{feature}</td>
      <td className="py-3 px-4 text-center">{free}</td>
      <td className="py-3 px-4 text-center">{pro}</td>
      <td className="py-3 px-4 text-center">{enterprise}</td>
    </tr>
  );
}

function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  
  return (
    <>
      <h2 className="text-3xl font-bold text-center mb-4">Start free. Upgrade when it matters.</h2>
      <p className="text-gray-400 text-center mb-6">No credit card required for Quick Check.</p>
      
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className={`text-sm ${billing === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
        <button onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
          className="relative w-12 h-6 bg-gray-700 rounded-full transition-colors cursor-pointer"
          style={{ backgroundColor: billing === 'annual' ? '#16a34a' : undefined }}>
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${billing === 'annual' ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${billing === 'annual' ? 'text-white' : 'text-gray-500'}`}>Annual</span>
        {billing === 'annual' && <span className="text-green-400 text-xs font-medium bg-green-500/10 px-2 py-0.5 rounded-full">Save up to 37%</span>}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
        <PriceCard
          tier="Quick Check"
          tagline="Instant pattern scan"
          price="$0"
          period=""
          features={['30 failure patterns tested', 'Confidence score & risks', 'Category detection', '5 validations per hour']}
          cta="Start Free ↑"
          highlight={false}
          scrollTo="validate"
        />
        <PriceCard
          tier="Guardian Debate"
          tagline="Put your idea on trial"
          price={billing === 'annual' ? '$249' : '$29'}
          period={billing === 'annual' ? '/yr' : '/mo'}
          features={[
            'Everything in Quick Check',
            '⚔️ 3-round adversarial AI debate',
            'Builder defends, Guardian attacks',
            'Graveyard: 1,310+ failures matched',
            'Full report emailed + PDF (~7 min)',
            '30 debates/month (5/day)',
            'API access',
            ...(billing === 'annual' ? ['💰 Save 28% vs monthly'] : []),
          ]}
          cta={billing === 'annual' ? 'Subscribe — $249/yr' : 'Subscribe — $29/mo'}
          highlight={true}
          plan={billing === 'annual' ? 'pro_annual' : 'pro'}
        />
        <PriceCard
          tier="Venture Verdict"
          tagline="Know your market before you build"
          price={billing === 'annual' ? '$1,499' : '$199'}
          period={billing === 'annual' ? '/yr' : '/mo'}
          features={[
            'Everything in Guardian Debate',
            '📊 Perplexity live market research',
            'TAM/SAM/SOM market sizing',
            'Competitor & funding analysis',
            'Revenue model assessment',
            'Full dossier emailed + PDF (~12 min)',
            '50 verdicts/month (10/day)',
            ...(billing === 'annual' ? ['💰 Save 37% vs monthly'] : []),
          ]}
          cta={billing === 'annual' ? 'Subscribe — $1,499/yr' : 'Subscribe — $199/mo'}
          highlight={false}
          plan={billing === 'annual' ? 'enterprise_annual' : 'enterprise'}
          accent="purple"
        />
      </div>

      {/* Per-report option */}
      <div className="max-w-2xl mx-auto bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
        <p className="text-gray-400 text-sm mb-3">Just need one report? No subscription required.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <OneTimeButton plan="single_debate" label="Single Guardian Debate — $14.99" />
          <OneTimeButton plan="single_verdict" label="Single Venture Verdict — $49.99" />
        </div>
      </div>
    </>
  );
}

function OneTimeButton({ plan, label }: { plan: string; label: string }) {
  const [loading, setLoading] = useState(false);
  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }
  return (
    <button onClick={handleClick} disabled={loading}
      className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 cursor-pointer">
      {loading ? '...' : label}
    </button>
  );
}

function PriceCard({ tier, tagline, price, period, features, cta, highlight, plan, scrollTo, accent }: {
  tier: string; tagline: string; price: string; period: string; features: string[]; cta: string; highlight: boolean; plan?: string; scrollTo?: string; accent?: string;
}) {
  const [loading, setLoading] = useState(false);
  const borderColor = accent === 'purple' ? 'border-purple-500/30 ring-purple-500/10' : highlight ? 'border-green-500/30 ring-green-500/10' : 'border-gray-800';
  const bgColor = accent === 'purple' ? 'bg-purple-500/5' : highlight ? 'bg-green-500/5' : 'bg-gray-900/50';
  const labelColor = accent === 'purple' ? 'text-purple-400' : 'text-green-400';

  async function handleClick() {
    if (scrollTo) { document.getElementById(scrollTo)?.scrollIntoView({ behavior: 'smooth' }); return; }
    if (!plan) return;
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || 'Failed to create checkout');
    } catch { alert('Something went wrong.'); }
    finally { setLoading(false); }
  }

  return (
    <div className={`rounded-2xl p-8 border ${borderColor} ${bgColor} ${highlight ? 'ring-1' : ''} ${accent === 'purple' ? 'ring-1' : ''}`}>
      {highlight && <div className="text-green-400 text-xs font-semibold uppercase tracking-wider mb-3">Most Popular</div>}
      {accent === 'purple' && <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider mb-3">Maximum Insight</div>}
      <h3 className="text-xl font-bold mb-1">{tier}</h3>
      <p className={`text-sm mb-4 ${labelColor}`}>{tagline}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-500">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-gray-300 text-sm">
            <span className={`mt-0.5 ${accent === 'purple' ? 'text-purple-400' : 'text-green-400'}`}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button onClick={handleClick} disabled={loading}
        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 ${
          highlight ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.15)]'
          : accent === 'purple' ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)]'
          : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
        }`}>
        {loading ? 'Redirecting...' : cta}
      </button>
    </div>
  );
}
