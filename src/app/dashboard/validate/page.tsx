'use client';
import Link from 'next/link';

export default function FeaturePage() {
  const items = [
    { t: "AI Writing Assistant for Lawyers", d: "Market: $2.1B • Competition: Medium • Feasibility: 82% • Score: 76/100", s: "viable" },
    { t: "Pet Health Tracker App", d: "Market: $340M • Competition: High • Feasibility: 90% • Score: 58/100", s: "risky" },
    { t: "Solar Panel Marketplace", d: "Market: $12B • Competition: Low • Feasibility: 65% • Score: 84/100", s: "strong" },
    { t: "AR Interior Design", d: "Market: $890M • Competition: Medium • Feasibility: 45% • Score: 52/100", s: "risky" }
  ];
  
  const styles: Record<string, string> = {
    'critical': 'bg-red-50 text-red-700',
    'warning': 'bg-yellow-50 text-yellow-700',
    'info': 'bg-blue-50 text-blue-700',
    'good': 'bg-green-50 text-green-700',
    'neutral': 'bg-gray-100 text-gray-600',
    'active': 'bg-green-50 text-green-700',
    'ready': 'bg-green-50 text-green-700',
    'popular': 'bg-purple-50 text-purple-700',
    'new': 'bg-blue-50 text-blue-700',
    'pass': 'bg-green-50 text-green-700',
    'fail': 'bg-red-50 text-red-700',
    'pending': 'bg-gray-100 text-gray-600',
    'gain': 'bg-green-50 text-green-700',
    'loss': 'bg-red-50 text-red-700',
    'green': 'bg-green-50 text-green-700',
    'yellow': 'bg-yellow-50 text-yellow-700',
    'orange': 'bg-orange-50 text-orange-700',
    'red': 'bg-red-50 text-red-700',
    'positive': 'bg-green-50 text-green-700',
    'negative': 'bg-red-50 text-red-700',
    'mixed': 'bg-yellow-50 text-yellow-700',
    'baseline': 'bg-gray-100 text-gray-600',
    'best': 'bg-green-50 text-green-700',
    'added': 'bg-green-50 text-green-700',
    'modified': 'bg-yellow-50 text-yellow-700',
    'removed': 'bg-red-50 text-red-700',
    'current': 'bg-blue-50 text-blue-700',
    'savings': 'bg-green-50 text-green-700',
    'expensive': 'bg-red-50 text-red-700',
    'viable': 'bg-green-50 text-green-700',
    'risky': 'bg-yellow-50 text-yellow-700',
    'strong': 'bg-green-50 text-green-700',
    'healthy': 'bg-green-50 text-green-700',
    'degraded': 'bg-yellow-50 text-yellow-700',
    'open': 'bg-blue-50 text-blue-700',
    'scheduled': 'bg-purple-50 text-purple-700',
    'unassigned': 'bg-gray-100 text-gray-600',
    'completed': 'bg-green-50 text-green-700',
    'result': 'bg-blue-50 text-blue-700',
    'visit': 'bg-purple-50 text-purple-700',
    'rx': 'bg-green-50 text-green-700',
    'improving': 'bg-green-50 text-green-700',
    'action': 'bg-blue-50 text-blue-700',
    'growing': 'bg-green-50 text-green-700',
    'top': 'bg-purple-50 text-purple-700',
    'stable': 'bg-gray-100 text-gray-600',
    'synced': 'bg-green-50 text-green-700',
    'drift': 'bg-yellow-50 text-yellow-700',
    'optimized': 'bg-green-50 text-green-700',
    'suboptimal': 'bg-yellow-50 text-yellow-700',
    'planned': 'bg-blue-50 text-blue-700',
    'clear': 'bg-green-50 text-green-700',
    'compliant': 'bg-green-50 text-green-700',
    'in-progress': 'bg-blue-50 text-blue-700',
    'expired': 'bg-red-50 text-red-700',
    'at-risk': 'bg-yellow-50 text-yellow-700',
    'improved': 'bg-green-50 text-green-700',
    'classified': 'bg-green-50 text-green-700',
    'search': 'bg-blue-50 text-blue-700',
    'delayed': 'bg-yellow-50 text-yellow-700',
    'error': 'bg-red-50 text-red-700',
    'table': 'bg-blue-50 text-blue-700',
    'relation': 'bg-purple-50 text-purple-700',
    'chart': 'bg-blue-50 text-blue-700',
    'metric': 'bg-green-50 text-green-700',
    'text': 'bg-gray-100 text-gray-600',
    'document': 'bg-blue-50 text-blue-700',
    'bug': 'bg-red-50 text-red-700',
    'template': 'bg-purple-50 text-purple-700',
    'must-have': 'bg-red-50 text-red-700',
    'should-have': 'bg-yellow-50 text-yellow-700',
    'safe': 'bg-green-50 text-green-700',
    'medium': 'bg-yellow-50 text-yellow-700',
    'danger': 'bg-red-50 text-red-700',
    'insight': 'bg-purple-50 text-purple-700',
    'resolved': 'bg-green-50 text-green-700',
    'seo': 'bg-blue-50 text-blue-700',
    'contract': 'bg-purple-50 text-purple-700',
    'review': 'bg-yellow-50 text-yellow-700',
    'report': 'bg-blue-50 text-blue-700',
    'inspection': 'bg-orange-50 text-orange-700',
    'log': 'bg-gray-100 text-gray-600',
    'visibility': 'bg-blue-50 text-blue-700',
    'validation': 'bg-green-50 text-green-700',
    'provider': 'bg-blue-50 text-blue-700',
    'secret': 'bg-red-50 text-red-700',
    'hazard': 'bg-orange-50 text-orange-700',
    'erd': 'bg-blue-50 text-blue-700',
    'dataset': 'bg-blue-50 text-blue-700',
    'hs': 'bg-green-50 text-green-700',
    'sync': 'bg-blue-50 text-blue-700',
    'timeline': 'bg-purple-50 text-purple-700',
    'doc': 'bg-blue-50 text-blue-700',
    'rule': 'bg-blue-50 text-blue-700',
    'vuln': 'bg-red-50 text-red-700',
    'attribution': 'bg-green-50 text-green-700',
    'threat': 'bg-red-50 text-red-700',
    'workorder': 'bg-blue-50 text-blue-700',
    'case': 'bg-purple-50 text-purple-700',
    'quality': 'bg-blue-50 text-blue-700',
    'revenue': 'bg-green-50 text-green-700',
    'pipeline': 'bg-blue-50 text-blue-700',
    'team': 'bg-blue-50 text-blue-700',
    'route': 'bg-blue-50 text-blue-700',
    'email': 'bg-blue-50 text-blue-700',
    'design': 'bg-purple-50 text-purple-700',
    'compliance': 'bg-blue-50 text-blue-700',
    'relationship': 'bg-blue-50 text-blue-700',
    'model': 'bg-blue-50 text-blue-700',
    'alert': 'bg-blue-50 text-blue-700',
    'sentiment': 'bg-blue-50 text-blue-700',
    'fee': 'bg-blue-50 text-blue-700',
    'tone': 'bg-blue-50 text-blue-700'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">← Dashboard</Link>
        <h1 className="font-bold">Idea Validation</h1>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <p className="text-gray-500 text-sm mb-6">Submit ideas for automated market validation</p>
        <div className="bg-white rounded-xl border divide-y">
          {items.map((item, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm">{item.t}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${styles[item.s] || 'bg-gray-100 text-gray-600'}`}>{item.s}</span>
              </div>
              <p className="text-xs text-gray-500">{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}