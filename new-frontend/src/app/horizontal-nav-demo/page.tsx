"use client";

import React, { useState } from 'react';
import { Menu, Leaf, Bookmark, User, Clock } from 'lucide-react';
import { HorizontalTabNav } from '@/components/shared/HorizontalTabNav';

export default function HorizontalNavDemo() {
  const [activeTab, setActiveTab] = useState('organic');

  const tabs = [
    { id: 'list', icon: <Menu className="w-6 h-6" />, label: 'Menu' },
    { id: 'organic', icon: <Leaf className="w-6 h-6" />, label: 'Organic' },
    { id: 'bookmark', icon: <Bookmark className="w-6 h-6" />, label: 'Saved' },
    { id: 'user', icon: <User className="w-6 h-6" />, label: 'Account' },
    { id: 'time', icon: <Clock className="w-6 h-6" />, label: 'Recent' },
  ];

  const contentMap = {
    list: 'Menu Section - Browse all items',
    organic: 'Organic Section - Eco-friendly products',
    bookmark: 'Saved Section - Your bookmarked items',
    user: 'Account Section - User profile',
    time: 'Recent Section - Recently viewed',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 mb-3">Horizontal Tab Navigation</h1>
          <p className="text-gray-600">Premium tab navigation with centered active indicator</p>
        </div>

        {/* Main Navigation */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <HorizontalTabNav
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Content Area */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-8 border border-emerald-200">
              <h2 className="text-2xl font-black text-emerald-900 mb-3">
                {tabs.find(t => t.id === activeTab)?.label}
              </h2>
              <p className="text-emerald-700 text-lg">
                {contentMap[activeTab as keyof typeof contentMap]}
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-bold text-gray-900 mb-2">Centered Focus</h3>
            <p className="text-sm text-gray-600">Active tab highlighted in center with green circle</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-bold text-gray-900 mb-2">Smooth Transitions</h3>
            <p className="text-sm text-gray-600">300ms transitions for all state changes</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-gray-900 mb-2">Responsive</h3>
            <p className="text-sm text-gray-600">Works seamlessly on all screen sizes</p>
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-12 bg-gray-900 rounded-2xl p-6 text-gray-100 font-mono text-sm overflow-x-auto">
          <pre>{`const tabs = [
  { id: 'list', icon: <Menu />, label: 'Menu' },
  { id: 'organic', icon: <Leaf />, label: 'Organic' },
  { id: 'bookmark', icon: <Bookmark />, label: 'Saved' },
  { id: 'user', icon: <User />, label: 'Account' },
  { id: 'time', icon: <Clock />, label: 'Recent' },
];

<HorizontalTabNav
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>`}</pre>
        </div>
      </div>
    </div>
  );
}
