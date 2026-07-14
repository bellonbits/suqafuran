"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, MessageSquare, Smartphone, Save, ChevronRight } from 'lucide-react';
import { useNotifications, NotificationPreferences } from '@/store/useNotifications';

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) => (
  <motion.button
    onClick={() => onChange(!checked)}
    className={`relative w-12 h-7 rounded-full transition-colors ${
      checked ? 'bg-[#5bc0e8]' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <motion.div
      layout
      className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${
        checked ? 'right-1' : 'left-1'
      }`}
    />
  </motion.button>
);

interface PreferenceSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: {
    key: keyof NotificationPreferences;
    label: string;
    description: string;
  }[];
}

export default function NotificationPreferencesPage() {
  const { preferences, updatePreferences } = useNotifications();
  const [localPrefs, setLocalPrefs] = useState(preferences);
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof NotificationPreferences) => {
    const updated = { ...localPrefs, [key]: !localPrefs[key] };
    setLocalPrefs(updated);
    setSaved(false);
  };

  const handleSave = () => {
    updatePreferences(localPrefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections: PreferenceSection[] = [
    {
      title: 'Notification Channels',
      description: 'Choose how you want to receive notifications',
      icon: <Bell size={24} className="text-[#5bc0e8]" />,
      settings: [
        {
          key: 'emailNotifications',
          label: 'Email Notifications',
          description: 'Receive order updates and receipts via email',
        },
        {
          key: 'smsNotifications',
          label: 'SMS Notifications',
          description: 'Get quick updates via SMS (rates may apply)',
        },
        {
          key: 'pushNotifications',
          label: 'Push Notifications',
          description: 'Real-time alerts on your device',
        },
        {
          key: 'inAppNotifications',
          label: 'In-App Notifications',
          description: 'See notifications when using Suqafuran',
        },
      ],
    },
    {
      title: 'Notification Types',
      description: 'Control what types of notifications you receive',
      icon: <MessageSquare size={24} className="text-green-600" />,
      settings: [
        {
          key: 'orderUpdates',
          label: 'Order Updates',
          description: 'Status changes, confirmations, and delivery updates',
        },
        {
          key: 'paymentUpdates',
          label: 'Payment Updates',
          description: 'Payment confirmations and receipts',
        },
        {
          key: 'deliveryUpdates',
          label: 'Delivery Updates',
          description: 'Rider location and delivery status',
        },
        {
          key: 'promotions',
          label: 'Promotions & Offers',
          description: 'Special deals and discount codes',
        },
        {
          key: 'systemAlerts',
          label: 'System Alerts',
          description: 'Important system announcements and maintenance notices',
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
            Notification Preferences
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize how and when you receive notifications from Suqafuran
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, sectionIdx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIdx * 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-gray-200 dark:border-slate-800"
            >
              {/* Section Header */}
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {section.description}
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <motion.div
                    key={setting.key}
                    whileHover={{ x: 4 }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {setting.label}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {setting.description}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <ToggleSwitch
                        checked={localPrefs[setting.key]}
                        onChange={() => handleToggle(setting.key)}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6"
        >
          <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
            <Smartphone size={20} />
            Tips
          </h3>
          <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• SMS notifications are great for urgent order updates</li>
            <li>• Push notifications work best when the app is closed</li>
            <li>• Email notifications include receipts and documentation</li>
            <li>• You can always check your notification history in the app</li>
          </ul>
        </motion.div>

        {/* Save Button */}
        <div className="mt-8 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex-1 bg-[#5bc0e8] hover:bg-blue-700 text-white font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3"
          >
            <Save size={20} />
            Save Preferences
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocalPrefs(preferences)}
            className="flex-1 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-900 dark:text-white font-black py-4 px-6 rounded-xl transition-all"
          >
            Reset
          </motion.button>
        </div>

        {/* Success Message */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3"
          >
            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            <p className="text-green-700 dark:text-green-300 font-bold text-sm">
              Preferences saved successfully!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
