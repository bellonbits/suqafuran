"use client";

import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function InventoryPage() {
  const inventory = [
    { id: 1, name: 'iPhone 15 Pro', sku: 'APP-001', stock: 45, lowStock: false, value: 'KSh 5,400,000' },
    { id: 2, name: 'Samsung Galaxy S24', sku: 'SAM-001', stock: 3, lowStock: true, value: 'KSh 285,000' },
    { id: 3, name: 'iPad Air', sku: 'APP-002', stock: 0, lowStock: true, value: 'KSh 0' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your product stock levels</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">156</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Low Stock</p>
          <p className="text-2xl font-bold text-red-600">3</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-orange-600">1</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh 5.6M</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Product</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Stock</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Inventory Value</th>
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white">Alert</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">{item.stock}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{item.value}</td>
                  <td className="px-6 py-4">
                    {item.lowStock && <AlertTriangle className="w-5 h-5 text-red-600" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
