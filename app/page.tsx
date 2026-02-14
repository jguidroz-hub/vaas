import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Vaas</h1>
          <nav className="flex items-center gap-4">
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900">Pricing</a>
            <Link href="/dashboard" className="text-sm px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
              Dashboard →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm mb-6">
          Now in production
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
          Vaas
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Vaas
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/api/auth/signup" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium">
            Get Started Free
          </Link>
          <a href="#features" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Everything you need</h3>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Real-time Dashboard', desc: 'Monitor everything at a glance with live data updates and customizable views.' },
            { title: 'Smart Automation', desc: 'Set up rules and let the system handle the repetitive work automatically.' },
            { title: 'Team Collaboration', desc: 'Invite your team, assign roles, and work together seamlessly.' },
            { title: 'Data Export', desc: 'Export your data in CSV, PDF, or JSON format anytime you need it.' },
            { title: 'API Access', desc: 'Full REST API with webhooks for custom integrations with your stack.' },
            { title: 'Enterprise Security', desc: 'SOC 2 ready with encryption at rest, audit logs, and SSO support.' },
          ].map((f, i) => (
            <div key={i} className="p-6 rounded-xl border bg-white hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-lg mb-2">{f.title}</h4>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 bg-gray-50 rounded-2xl my-12">
        <h3 className="text-3xl font-bold text-center mb-4">Simple pricing</h3>
        <p className="text-gray-600 text-center mb-12">Start free, upgrade when you need to.</p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { name: 'Free', price: '$0', period: 'forever', features: ['Up to 100 records', 'Basic dashboard', 'Email support', 'Community access'], cta: 'Get Started', primary: false },
            { name: 'Starter', price: '$19', period: '/month', features: ['Unlimited records', 'Advanced analytics', 'API access', 'Priority support', 'CSV export'], cta: 'Start Free Trial', primary: true },
            { name: 'Pro', price: '$49', period: '/month', features: ['Everything in Starter', 'Team collaboration', 'Custom integrations', 'Webhooks', 'SSO & audit logs', 'Dedicated support'], cta: 'Start Free Trial', primary: false },
          ].map((plan, i) => (
            <div key={i} className={`p-8 rounded-xl border ${plan.primary ? 'border-black bg-white shadow-lg scale-105' : 'bg-white'}`}>
              <h4 className="font-semibold text-lg">{plan.name}</h4>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-500">{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.primary ? '/api/billing/checkout' : '/api/auth/signup'}
                className={`block text-center py-2.5 rounded-lg font-medium ${plan.primary ? 'bg-black text-white hover:bg-gray-800' : 'border border-gray-300 hover:bg-gray-50'}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
        <p className="text-gray-600 mb-8">Join thousands of teams already using Vaas.</p>
        <Link href="/api/auth/signup" className="px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 font-medium">
          Start Free →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} Vaas. Built by <a href="https://projectgreenbelt.com" className="underline">Greenbelt</a>.</p>
      </footer>
    </div>
  );
}
