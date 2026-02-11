'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

function verdictColor(verdict: string | null) {
  if (!verdict) return '#94a3b8';
  if (verdict.includes('STRONG_GO')) return '#4ade80';
  if (verdict.includes('CONDITIONAL')) return '#facc15';
  if (verdict.includes('PIVOT')) return '#fb923c';
  return '#f87171';
}

function verdictEmoji(verdict: string | null) {
  if (!verdict) return '❓';
  if (verdict.includes('STRONG_GO')) return '🟢';
  if (verdict.includes('CONDITIONAL')) return '🟡';
  if (verdict.includes('PIVOT')) return '🟠';
  return '🔴';
}

function verdictLabel(verdict: string | null) {
  if (!verdict) return 'Pending';
  return verdict.replace(/_/g, ' ');
}

export default function ReportPage() {
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetch(`/api/reports?id=${params.id}`)
        .then(r => { if (!r.ok) throw new Error('Not found'); return r.json(); })
        .then(setReport)
        .catch(() => setError('Report not found'));
    }
  }, [params.id]);

  if (error) return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Report not found</h1>
        <a href="/" className="text-green-400 hover:underline">← Back to VaaS</a>
      </div>
    </main>
  );

  if (!report) return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100 flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading report...</div>
    </main>
  );

  const color = verdictColor(report.verdict);
  const isEnterprise = report.tier === 'enterprise';
  const enrichment = report.enrichment as any;
  const debateRounds = (report.debate_rounds || report.debateRounds || []) as any[];
  const strengths = (report.strengths || []) as string[];
  const risks = (report.risks || []) as string[];
  const conditions = (report.proceed_conditions || report.proceedConditions || []) as string[];

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-gray-100">
      <style>{`
        @media print {
          body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          main { background: white !important; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          section { border-color: #e5e7eb !important; }
          h1, h2, h3 { color: #111 !important; }
          p, li, td, div { color: #333 !important; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <a href="/" className="text-gray-500 hover:text-white text-sm">← Back to VaaS</a>
          <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm cursor-pointer">
            📄 Download PDF
          </button>
        </div>

        {/* Greenbelt Branding (print only) */}
        <div className="hidden print:block mb-8">
          <div className="text-2xl font-bold">Greenbelt VaaS</div>
          <div className="text-sm text-gray-500">Validation-as-a-Service · vaas-greenbelt.vercel.app</div>
        </div>

        {/* Report Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 uppercase tracking-wider">
              {isEnterprise ? '🔬 Venture Verdict' : '⚔️ Guardian Debate'}
            </span>
            <span className="text-gray-600 text-xs">
              {new Date(report.created_at || report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{report.idea}</h1>
          
          {report.audience && (
            <p className="text-gray-400 mb-2">
              <span className="text-gray-500">Target:</span> {report.audience}
            </p>
          )}
          {(report.revenue_model || report.revenueModel) && (
            <p className="text-gray-400 mb-4">
              <span className="text-gray-500">Model:</span> {report.revenue_model || report.revenueModel}
            </p>
          )}
        </div>

        {/* Verdict Card */}
        <section className="rounded-2xl p-8 mb-8" style={{ backgroundColor: `${color}10`, border: `1px solid ${color}30` }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Verdict</div>
              <div className="text-2xl font-bold" style={{ color }}>
                {verdictEmoji(report.verdict)} {verdictLabel(report.verdict)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400 uppercase tracking-wider mb-1">Confidence</div>
              <div className="text-4xl font-bold" style={{ color }}>{report.confidence || '—'}%</div>
            </div>
          </div>

          {(report.executive_summary || report.executiveSummary) && (
            <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${color}20` }}>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Executive Summary</h3>
              <p className="text-gray-300 leading-relaxed">{report.executive_summary || report.executiveSummary}</p>
            </div>
          )}
        </section>

        {/* Enterprise: Research Dossier */}
        {isEnterprise && enrichment && (
          <section className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-8 mb-8 print-break">
            <h2 className="text-xl font-bold mb-6 text-purple-400">📊 Market Research Dossier</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {enrichment.problemStatement && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Problem Statement</h3>
                  <p className="text-gray-300 text-sm">{enrichment.problemStatement}</p>
                </div>
              )}
              {enrichment.valueProp && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Value Proposition</h3>
                  <p className="text-gray-300 text-sm">{enrichment.valueProp}</p>
                </div>
              )}
            </div>

            {enrichment.marketSize && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Market Size</h3>
                <div className="grid grid-cols-3 gap-4">
                  {enrichment.marketSize.tam && <div className="bg-gray-900/50 rounded-xl p-4 text-center"><div className="text-purple-400 font-bold text-lg">{enrichment.marketSize.tam}</div><div className="text-gray-500 text-xs">TAM</div></div>}
                  {enrichment.marketSize.sam && <div className="bg-gray-900/50 rounded-xl p-4 text-center"><div className="text-purple-400 font-bold text-lg">{enrichment.marketSize.sam}</div><div className="text-gray-500 text-xs">SAM</div></div>}
                  {enrichment.marketSize.som && <div className="bg-gray-900/50 rounded-xl p-4 text-center"><div className="text-purple-400 font-bold text-lg">{enrichment.marketSize.som}</div><div className="text-gray-500 text-xs">SOM</div></div>}
                </div>
              </div>
            )}

            {enrichment.competitors?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Competitors</h3>
                <div className="space-y-2">
                  {enrichment.competitors.map((c: any, i: number) => (
                    <div key={i} className="bg-gray-900/50 rounded-lg p-3 text-sm text-gray-300">
                      {typeof c === 'string' ? c : `${c.name || c} — ${c.description || ''}`}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {enrichment.revenueModel && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Revenue Model</h3>
                <p className="text-gray-300 text-sm">{typeof enrichment.revenueModel === 'string' ? enrichment.revenueModel : JSON.stringify(enrichment.revenueModel)}</p>
              </div>
            )}

            {enrichment.unfairAdvantages?.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Unfair Advantages</h3>
                <ul className="space-y-1">
                  {enrichment.unfairAdvantages.map((a: string, i: number) => (
                    <li key={i} className="text-gray-300 text-sm flex items-start gap-2"><span className="text-purple-400">◆</span> {a}</li>
                  ))}
                </ul>
              </div>
            )}

            {enrichment.marketResearch && (
              <div className="mt-6 pt-6 border-t border-purple-500/10">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Live Market Intelligence</h3>
                {enrichment.marketResearch.marketTrends?.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-xs text-gray-500 mb-1">Trends</h4>
                    <ul className="space-y-1">{enrichment.marketResearch.marketTrends.slice(0, 5).map((t: string, i: number) => <li key={i} className="text-gray-400 text-sm">• {t}</li>)}</ul>
                  </div>
                )}
                {enrichment.marketResearch.competitorActivity?.length > 0 && (
                  <div>
                    <h4 className="text-xs text-gray-500 mb-1">Competitor Activity</h4>
                    <ul className="space-y-1">{enrichment.marketResearch.competitorActivity.slice(0, 5).map((c: string, i: number) => <li key={i} className="text-gray-400 text-sm">• {c}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Strengths & Risks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {strengths.length > 0 && (
            <section className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-green-400">✅ Strengths</h2>
              <ul className="space-y-2">
                {strengths.map((s, i) => <li key={i} className="text-gray-300 text-sm flex items-start gap-2"><span className="text-green-400 mt-0.5">•</span> {s}</li>)}
              </ul>
            </section>
          )}
          {risks.length > 0 && (
            <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4 text-red-400">⚠️ Risks</h2>
              <ul className="space-y-2">
                {risks.map((r, i) => <li key={i} className="text-gray-300 text-sm flex items-start gap-2"><span className="text-red-400 mt-0.5">•</span> {r}</li>)}
              </ul>
            </section>
          )}
        </div>

        {/* Proceed Conditions */}
        {conditions.length > 0 && (
          <section className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4 text-yellow-400">📋 Proceed Conditions</h2>
            <ol className="space-y-2 list-decimal list-inside">
              {conditions.map((c, i) => <li key={i} className="text-gray-300 text-sm">{c}</li>)}
            </ol>
          </section>
        )}

        {/* Debate Transcript */}
        {debateRounds.length > 0 && (
          <section className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 mb-8 print-break">
            <h2 className="text-lg font-bold mb-4">⚔️ Adversarial Debate ({debateRounds.length} rounds)</h2>
            <div className="space-y-6">
              {debateRounds.map((round: any, i: number) => (
                <div key={i} className="border-l-2 border-gray-700 pl-4">
                  <div className="text-sm font-semibold text-gray-400 mb-2">Round {i + 1}</div>
                  
                  {(round.guardian || round.attack || round.flaw || round.argument) && (
                    <div className="mb-3">
                      <div className="text-xs text-red-400 uppercase tracking-wider mb-1">🛡️ Guardian Attack</div>
                      <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed [&>strong]:text-red-300 [&>strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: (round.guardian || round.attack || round.flaw || round.argument || '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  )}
                  
                  {(round.builder || round.rebuttal || round.defense) && (
                    <div>
                      <div className="text-xs text-green-400 uppercase tracking-wider mb-1">🏗️ Builder Defense</div>
                      <div className="text-gray-300 text-sm whitespace-pre-line leading-relaxed [&>strong]:text-green-300 [&>strong]:font-semibold"
                        dangerouslySetInnerHTML={{ __html: (round.builder || round.rebuttal || round.defense || '').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Build CTA */}
        {(report.verdict?.includes('STRONG_GO') || report.verdict?.includes('CONDITIONAL')) && (
          <section className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-cyan-500/5 border border-green-500/20 rounded-2xl p-8 mb-8 text-center no-print">
            <h2 className="text-2xl font-bold mb-2">Ready to build?</h2>
            <p className="text-gray-400 mb-4">Your idea passed Guardian review. Let Greenbelt&apos;s AI factory turn it into a production app.</p>
            <a href={`/build?idea=${encodeURIComponent(report.idea)}&verdict=${encodeURIComponent(report.verdict || '')}&confidence=${report.confidence || ''}&email=${encodeURIComponent(report.email)}`}
              className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold py-3 px-8 rounded-xl transition-all">
              Build This with Greenbelt →
            </a>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-gray-600 text-xs mt-12 pt-8 border-t border-gray-800/50">
          <p>Generated by <a href="https://vaas-greenbelt.vercel.app" className="text-green-400 hover:underline no-print">Greenbelt VaaS</a><span className="hidden print:inline"> Greenbelt VaaS (vaas-greenbelt.vercel.app)</span></p>
          {(report.total_cost_usd || report.totalCostUsd) && <p className="mt-1">AI cost: ${report.total_cost_usd || report.totalCostUsd} · Duration: {(report.duration_seconds || report.durationSeconds) ? `${Math.round((report.duration_seconds || report.durationSeconds) / 60)}min` : '—'}</p>}
          <p className="mt-1">Report ID: {report.id}</p>
        </footer>
      </div>
    </main>
  );
}
