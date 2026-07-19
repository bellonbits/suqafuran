"use client";

import React from 'react';
import { Plus } from 'lucide-react';

export default function DeliveryPage() {
  const deliveryZones = [
    { id: 1, name: 'Eastleigh', fee: 'KSh 200', orders: 45, status: 'Active' },
    { id: 2, name: 'Nairobi CBD', fee: 'KSh 250', orders: 67, status: 'Active' },
    { id: 3, name: 'South C', fee: 'KSh 300', orders: 32, status: 'Active' },
    { id: 4, name: 'Westlands', fee: 'KSh 350', orders: 30, status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Delivery Zones</h1>
          <p className="text-gray-600 dark:text-slate-400">Manage delivery zones and pricing</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus className="w-5 h-5" />
          Add Zone
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Active Zones</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Deliveries</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">174</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Avg Revenue</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh 15,000</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Zone Name</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Delivery Fee</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Orders</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Status</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.map((zone) => (
                <tr key={zone.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{zone.name}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{zone.fee}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{zone.orders}</td>
                  <td className="px-6 py-4"><span className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">{zone.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
