'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { useShopManagementStore } from '../../store/admin/useShopManagementStore';
import { adminShopService } from '../../services/adminShopService';
import type { Shop } from '../../store/admin/useShopManagementStore';

interface ShopNameEditModalProps {
  shop: Shop | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ShopNameEditModal: React.FC<ShopNameEditModalProps> = ({
  shop,
  onClose,
  onSuccess,
}) => {
  const store = useShopManagementStore();
  const [newName, setNewName] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (shop) {
      setNewName(shop.business_name);
      setLocalError('');
    }
  }, [shop]);

  const handleSave = async () => {
    if (!shop || !newName.trim()) {
      setLocalError('Shop name cannot be empty');
      return;
    }

    if (newName === shop.business_name) {
      setLocalError('No changes made');
      return;
    }

    if (newName.length > 100) {
      setLocalError('Shop name must be 100 characters or less');
      return;
    }

    store.setSaving(true);
    setLocalError('');

    try {
      const response = await adminShopService.updateShopName(
        shop.id,
        newName
      );

      store.updateShopName(shop.id, response.new_name);
      store.setSaveSuccess(response.message);

      setTimeout(() => {
        onClose();
        onSuccess?.();
      }, 1500);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Failed to update shop name';
      setLocalError(errorMsg);
      store.setSaveError(errorMsg);
    } finally {
      store.setSaving(false);
    }
  };

  if (!shop) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Edit Shop Name
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Shop Info */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Shop Owner
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {shop.full_name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {shop.email}
            </p>
          </div>

          {/* Input */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Shop Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setLocalError('');
              }}
              placeholder="Enter new shop name"
              maxLength={100}
              disabled={store.isSaving}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {newName.length}/100 characters
            </p>
          </div>

          {/* Success Message */}
          {store.saveSuccess && (
            <div className="flex gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-300">
                {store.saveSuccess}
              </p>
            </div>
          )}

          {/* Error Message */}
          {(localError || store.saveError) && (
            <div className="flex gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 dark:text-red-300">
                {localError || store.saveError}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={onClose}
            disabled={store.isSaving}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={store.isSaving || !newName.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium transition-colors disabled:opacity-50"
          >
            {store.isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};
