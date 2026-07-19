"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Loader } from 'lucide-react';
import api from '@/services/api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      const res = await api.get('/listings/me?limit=100').catch(() => null);

      if (res?.data) {
        const products = Array.isArray(res.data) ? res.data : [];
        setInventory(products);

        const totalItems = products.reduce((sum: number, p: any) => sum + (p.stock || 0), 0);
        const lowStockCount = products.filter((p: any) => (p.stock || 0) > 0 && (p.stock || 0) <= 20).length;
        const outOfStockCount = products.filter((p: any) => (p.stock || 0) === 0).length;
        const inventoryValue = products.reduce((sum: number, p: any) => sum + ((p.price || 0) * (p.stock || 0)), 0);

        setStats({
          total_items: totalItems,
          low_stock: lowStockCount,
          out_of_stock: outOfStockCount,
          inventory_value: inventoryValue,
        });
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 animate-spin text-orange-600" />
          <p className="text-gray-500 text-sm">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventory</h1>
        <p className="text-gray-600 dark:text-slate-400">Track your product stock levels</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Total Items</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_items || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Low Stock</p>
          <p className="text-2xl font-bold text-red-600">{stats?.low_stock || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Out of Stock</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.out_of_stock || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 border border-gray-200 dark:border-slate-800">
          <p className="text-gray-600 dark:text-slate-400 text-sm mb-2">Inventory Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">KSh {((stats?.inventory_value || 0) / 1000000).toFixed(1)}M</p>
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
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">No products in inventory</td>
                </tr>
              ) : (
                inventory.map((item) => {
                  const itemValue = (item.price || 0) * (item.stock || 0);
                  const isLowStock = (item.stock || 0) > 0 && (item.stock || 0) <= 20;
                  const isOutOfStock = (item.stock || 0) === 0;

                  return (
                    <tr key={item.id} className="border-b border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white truncate">{item.title_en || item.title || 'Untitled Product'}</p>
                          <p className="text-xs text-gray-500">{item.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                            : isLowStock
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        }`}>
                          {item.stock || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">KSh {itemValue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {(isLowStock || isOutOfStock) && <AlertTriangle className="w-5 h-5 text-red-600" />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
