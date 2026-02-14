'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold">Vaas</Link>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="text-sm text-gray-600 hover:text-gray-900">Settings</button>
          <div className="w-8 h-8 bg-gray-200 rounded-full" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Items', value: '1,234', change: '+12%' },
            { label: 'Active Users', value: '56', change: '+5%' },
            { label: 'Completion Rate', value: '94%', change: '+2%' },
            { label: 'Avg. Response', value: '1.2s', change: '-15%' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl border p-5">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
              <p className="text-xs text-green-600 mt-1">{stat.change} vs last month</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-lg border p-1 w-fit">
          {['overview', 'analytics', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === tab ? 'bg-black text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <button className="text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50">Export CSV</button>
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg" />
                  <div>
                    <p className="text-sm font-medium">Item #{1000 + i}</p>
                    <p className="text-xs text-gray-500">Updated {i} hour{i > 1 ? 's' : ''} ago</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
