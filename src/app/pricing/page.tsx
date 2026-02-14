"use client";
import Link from "next/link";
const plans = [
  { name: "Free", price: "$0", period: "forever", features: ["Up to 3 projects", "Basic features", "Community support"], cta: "Get Started", href: "/signup", popular: false },
  { name: "Starter", price: "$19", period: "/month", features: ["Up to 10 projects", "All core features", "Email support", "30-day retention", "API access"], cta: "Start Free Trial", href: "/signup?plan=starter", popular: true },
  { name: "Pro", price: "$49", period: "/month", features: ["Unlimited projects", "Advanced analytics", "Priority support", "Unlimited retention", "Full API", "Team collaboration"], cta: "Start Free Trial", href: "/signup?plan=pro", popular: false },
];
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-4">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">Start free, upgrade when you need more</p>
      </div>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.name} className={`bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm ${plan.popular ? "ring-2 ring-blue-600 scale-105" : ""}`}>
            {plan.popular && <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full mb-4 inline-block">Most Popular</span>}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <div className="mt-4"><span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span><span className="text-gray-500 ml-1">{plan.period}</span></div>
            <ul className="mt-6 space-y-3">{plan.features.map((f) => <li key={f} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"><span className="text-green-500">✓</span>{f}</li>)}</ul>
            <Link href={plan.href} className={`mt-8 block w-full py-3 text-center rounded-lg font-medium ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200"}`}>{plan.cta}</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
