"use client";

import React from 'react';
import Link from 'next/link';
import { Activity, Bell, Radio, MessageSquare, Zap, Network } from 'lucide-react';

export default function MonitoringDashboard() {
  const sections = [
    {
      title: 'Alert Rules',
      description: 'Configure and manage alert rules for system monitoring',
      icon: Bell,
      href: '/admin-dashboard/monitoring/alerts',
      color: 'bg-blue-50 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Live Events',
      description: 'Real-time event streaming and monitoring',
      icon: Radio,
      href: '/admin-dashboard/monitoring/live',
      color: 'bg-green-50 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Notifications',
      description: 'Alert notification logs and history',
      icon: MessageSquare,
      href: '/admin-dashboard/monitoring/notifications',
      color: 'bg-purple-50 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Kafka Streams',
      description: 'Message broker monitoring and metrics',
      icon: Network,
      href: '/admin-dashboard/monitoring/kafka',
      color: 'bg-orange-50 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Distributed Traces',
      description: 'Request tracing via Jaeger and OpenTelemetry',
      icon: Zap,
      href: '/admin-dashboard/monitoring/traces',
      color: 'bg-red-50 dark:bg-red-900/20',
      iconColor: 'text-red-600 dark:text-red-400'
    },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">System Monitoring</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor alerts, events, and system health in real-time</p>
      </div>

      {/* Grid of monitoring sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => {
          const IconComponent = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <div className={`h-full p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition cursor-pointer group ${section.color}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-white dark:bg-slate-800 ${section.iconColor}`}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Tip:</strong> The monitoring system tracks system health, alert rules execution, and real-time events.
          Use these tools to maintain visibility into your application's performance and health.
        </p>
      </div>
    </div>
  );
}
