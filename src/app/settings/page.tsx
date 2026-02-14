'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    email: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en',
    emailNotifications: true,
    slackNotifications: false,
    webhookUrl: '',
    weeklyDigest: true,
    apiKeyVisible: false,
    twoFactorEnabled: false,
    sessionTimeout: '30',
    ipWhitelist: '',
    dataRetention: '90',
    exportFormat: 'csv',
    theme: 'system',
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const updateSetting = (key: string, value: any) => setSettings(prev => ({ ...prev, [key]: value }));

  const sections = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'api', label: 'API & Integrations', icon: '🔗' },
    { id: 'data', label: 'Data & Privacy', icon: '📊' },
    { id: 'billing', label: 'Billing', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">← Back</Link>
          <h1 className="font-bold">{productName} Settings</h1>
        </div>
        <button onClick={handleSave} className={`px-4 py-2 rounded-lg text-sm font-medium ${saved ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <nav className="w-56 flex-shrink-0">
          <div className="space-y-1">
            {sections.map(s => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${activeSection === s.id ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {activeSection === 'general' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">General Settings</h2>
              <div className="grid gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <input type="text" value={settings.companyName} onChange={e => updateSetting('companyName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black" placeholder="Your company" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={settings.email} onChange={e => updateSetting('email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-black focus:border-black" placeholder="you@company.com" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    <select value={settings.timezone} onChange={e => updateSetting('timezone', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="America/New_York">Eastern</option><option value="America/Chicago">Central</option>
                      <option value="America/Denver">Mountain</option><option value="America/Los_Angeles">Pacific</option>
                      <option value="Europe/London">London</option><option value="Europe/Berlin">Berlin</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <select value={settings.theme} onChange={e => updateSetting('theme', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option>
                    </select></div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email notifications', desc: 'Receive alerts and updates via email' },
                  { key: 'slackNotifications', label: 'Slack notifications', desc: 'Send alerts to your Slack workspace' },
                  { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Get a summary of activity every Monday' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div><p className="text-sm font-medium">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                    <button onClick={() => updateSetting(item.key, !settings[item.key as keyof typeof settings])}
                      className={`w-11 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-black' : 'bg-gray-300'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings[item.key as keyof typeof settings] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                ))}
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                  <input type="url" value={settings.webhookUrl} onChange={e => updateSetting('webhookUrl', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="https://your-webhook.com/endpoint" /></div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Security</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div><p className="text-sm font-medium">Two-factor authentication</p><p className="text-xs text-gray-500">Add an extra layer of security</p></div>
                  <button onClick={() => updateSetting('twoFactorEnabled', !settings.twoFactorEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors ${settings.twoFactorEnabled ? 'bg-black' : 'bg-gray-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${settings.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <select value={settings.sessionTimeout} onChange={e => updateSetting('sessionTimeout', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="15">15 minutes</option><option value="30">30 minutes</option>
                    <option value="60">1 hour</option><option value="480">8 hours</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">IP Whitelist</label>
                  <textarea value={settings.ipWhitelist} onChange={e => updateSetting('ipWhitelist', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" rows={3} placeholder="One IP per line (leave empty to allow all)" /></div>
              </div>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">API & Integrations</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">API Key</p>
                    <button onClick={() => updateSetting('apiKeyVisible', !settings.apiKeyVisible)} className="text-xs text-blue-600 hover:underline">
                      {settings.apiKeyVisible ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <code className="text-sm bg-white px-3 py-2 rounded border block font-mono">
                    {settings.apiKeyVisible ? 'sk_live_' + 'x'.repeat(32) : '••••••••••••••••••••••••••••'}
                  </code>
                </div>
                <div className="flex gap-3">
                  <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Regenerate Key</button>
                  <button className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">View Docs</button>
                </div>
                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium mb-3">Connected Integrations</h3>
                  <div className="space-y-2">
                    {['Slack', 'GitHub', 'Jira', 'Zapier'].map(name => (
                      <div key={name} className="flex items-center justify-between py-2">
                        <span className="text-sm">{name}</span>
                        <button className="text-xs px-3 py-1 border rounded-lg hover:bg-gray-50">Connect</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'data' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Data & Privacy</h2>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Data Retention (days)</label>
                  <select value={settings.dataRetention} onChange={e => updateSetting('dataRetention', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="30">30 days</option><option value="90">90 days</option>
                    <option value="365">1 year</option><option value="unlimited">Unlimited</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Default Export Format</label>
                  <select value={settings.exportFormat} onChange={e => updateSetting('exportFormat', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="csv">CSV</option><option value="json">JSON</option><option value="pdf">PDF</option>
                  </select></div>
                <div className="border-t pt-4 space-y-3">
                  <button className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 text-sm">📥 Export All Data</button>
                  <button className="w-full text-left px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 text-sm text-red-600">🗑️ Delete Account & Data</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'billing' && (
            <div className="bg-white rounded-xl border p-6 space-y-6">
              <h2 className="text-lg font-semibold">Billing & Subscription</h2>
              <div className="p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                <div><p className="text-sm font-medium">Current Plan: <span className="text-blue-700">Starter ($19/mo)</span></p>
                  <p className="text-xs text-gray-500 mt-1">Next billing date: March 14, 2026</p></div>
                <Link href="/api/billing/checkout" className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800">Upgrade to Pro</Link>
              </div>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Recent Invoices</h3>
                <div className="space-y-2">
                  {['Feb 14, 2026', 'Jan 14, 2026', 'Dec 14, 2025'].map((date, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div><p className="text-sm">{date}</p><p className="text-xs text-gray-500">Starter Plan</p></div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">$19.00</span>
                        <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">Paid</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
