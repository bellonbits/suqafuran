"use client";

import React, { useState } from 'react';
import { Save, Bell, Lock } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    orderAlerts: true,
    lowStockAlerts: true,
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-slate-400">Manage your account and notification preferences</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Push Notifications</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">Receive push notifications on your device</p>
            </div>
            <input type="checkbox" checked={settings.notifications} onChange={(e) => setSettings({...settings, notifications: e.target.checked})} className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-xs text-gray-600 dark:text-slate-400">Receive email updates about your orders</p>
            </div>
            <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} className="w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-5 h-5 text-red-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Account Security</h2>
        </div>

        <div className="space-y-4">
          <button className="w-full px-4 py-3 border border-gray-200 dark:border-slate-800 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-left font-semibold text-gray-900 dark:text-white">
            Change Password
          </button>
          <button className="w-full px-4 py-3 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-left font-semibold text-red-600">
            Delete Account
          </button>
        </div>
      </div>

      <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2">
        <Save className="w-5 h-5" />
        Save Settings
      </button>
    </div>
  );
}
