'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, MessageSquare, Package, TrendingUp, Calendar, Zap, Heart, AlertCircle } from 'lucide-react';

interface EmailPreference {
  user_id: number;
  new_messages: boolean;
  listing_updates: boolean;
  price_drops: boolean;
  saved_search_matches: boolean;
  marketplace_digest: boolean;
  promotional_emails: boolean;
  seller_tips: boolean;
  verification_campaigns: boolean;
  seasonal_campaigns: boolean;
  digest_frequency: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

interface SavedSearch {
  id: number;
  user_id: number;
  query: string;
  min_price: number | null;
  max_price: number | null;
  location: string | null;
  created_at: string;
}

const emailCategories = [
  {
    key: 'new_messages',
    label: 'New Messages',
    description: 'Get notified when you receive messages',
    icon: MessageSquare
  },
  {
    key: 'listing_updates',
    label: 'Listing Updates',
    description: 'Updates about your listings (views, saves, comments)',
    icon: Package
  },
  {
    key: 'price_drops',
    label: 'Price Drops',
    description: 'Alerts when saved items go on sale',
    icon: TrendingUp
  },
  {
    key: 'saved_search_matches',
    label: 'Search Matches',
    description: 'New listings matching your saved searches',
    icon: Heart
  },
  {
    key: 'marketplace_digest',
    label: 'Weekly Digest',
    description: 'Curated marketplace summary and trending items',
    icon: Calendar
  },
  {
    key: 'promotional_emails',
    label: 'Promotions',
    description: 'Special offers and marketplace promotions',
    icon: Zap
  },
  {
    key: 'seller_tips',
    label: 'Seller Tips',
    description: 'Tips and best practices for growing your sales',
    icon: AlertCircle
  },
  {
    key: 'verification_campaigns',
    label: 'Verification',
    description: 'Account verification and security updates',
    icon: Bell
  },
  {
    key: 'seasonal_campaigns',
    label: 'Seasonal',
    description: 'Seasonal campaigns and special events',
    icon: Calendar
  }
];

export default function NotificationsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<EmailPreference | null>(null);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSearch, setNewSearch] = useState('');
  const [searchMinPrice, setSearchMinPrice] = useState('');
  const [searchMaxPrice, setSearchMaxPrice] = useState('');
  const [searchLocation, setSearchLocation] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchPreferences();
    fetchSavedSearches();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/marketing/email-preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Failed to fetch email preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email preferences',
        variant: 'destructive'
      });
    }
  };

  const fetchSavedSearches = async () => {
    try {
      const response = await api.get('/marketing/saved-searches');
      setSavedSearches(response.data.saved_searches || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch saved searches:', error);
      setLoading(false);
    }
  };

  const handleTogglePreference = async (key: string, value: boolean) => {
    if (!preferences) return;

    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    setSaving(true);
    try {
      await api.put('/marketing/email-preferences', updated);
      toast({
        title: 'Success',
        description: 'Email preferences updated',
      });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive'
      });
      // Revert on error
      setPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSearch.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a search query',
        variant: 'destructive'
      });
      return;
    }

    try {
      await api.post('/marketing/saved-search', {
        query: newSearch,
        min_price: searchMinPrice ? parseFloat(searchMinPrice) : null,
        max_price: searchMaxPrice ? parseFloat(searchMaxPrice) : null,
        location: searchLocation || null
      });

      toast({
        title: 'Success',
        description: 'Search saved! You\'ll get alerts for matching items',
      });

      setNewSearch('');
      setSearchMinPrice('');
      setSearchMaxPrice('');
      setSearchLocation('');
      fetchSavedSearches();
    } catch (error) {
      console.error('Failed to save search:', error);
      toast({
        title: 'Error',
        description: 'Failed to save search',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteSearch = async (searchId: number) => {
    try {
      await api.delete(`/marketing/saved-search/${searchId}`);
      toast({
        title: 'Success',
        description: 'Saved search removed',
      });
      fetchSavedSearches();
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete search',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600 mt-2">Manage your email preferences and saved searches</p>
        </div>

        {/* Email Preferences */}
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Email Preferences</h2>
            <p className="text-sm text-gray-600">Choose which emails you'd like to receive</p>
          </div>

          <div className="space-y-4">
            {emailCategories.map((category) => {
              const Icon = category.icon;
              const isEnabled = preferences ? preferences[category.key as keyof EmailPreference] : false;

              return (
                <div key={category.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex items-start gap-4 flex-1">
                    <Icon className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{category.label}</p>
                      <p className="text-sm text-gray-600">{category.description}</p>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleTogglePreference(category.key, e.target.checked)}
                      disabled={saving}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
              );
            })}
          </div>

          {/* Digest Frequency */}
          <div className="mt-8 pt-8 border-t">
            <label className="block text-sm font-medium text-gray-900 mb-3">Email Digest Frequency</label>
            <select
              value={preferences?.digest_frequency || 'weekly'}
              onChange={(e) => handleTogglePreference('digest_frequency', true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={saving}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="never">Never</option>
            </select>
          </div>
        </Card>

        {/* Saved Searches */}
        <Card className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Saved Searches</h2>
            <p className="text-sm text-gray-600">Get email alerts for new listings matching your searches</p>
          </div>

          {/* Add New Search */}
          <form onSubmit={handleSaveSearch} className="mb-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Save a new search</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="What are you looking for? (e.g., 'iPhone 14')"
                value={newSearch}
                onChange={(e) => setNewSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="number"
                  placeholder="Min price (optional)"
                  value={searchMinPrice}
                  onChange={(e) => setSearchMinPrice(e.target.value)}
                  min="0"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max price (optional)"
                  value={searchMaxPrice}
                  onChange={(e) => setSearchMaxPrice(e.target.value)}
                  min="0"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Location (optional)"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Save Search
              </button>
            </div>
          </form>

          {/* Saved Searches List */}
          <div className="space-y-3">
            {savedSearches.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No saved searches yet. Create one above to get started!</p>
            ) : (
              savedSearches.map((search) => (
                <div key={search.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{search.query}</p>
                    <p className="text-sm text-gray-600">
                      {[
                        search.min_price && `Min: ${search.min_price}`,
                        search.max_price && `Max: ${search.max_price}`,
                        search.location && `Location: ${search.location}`
                      ].filter(Boolean).join(' • ')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteSearch(search.id)}
                    className="ml-4 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Help Text */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> You can unsubscribe from any email at any time by clicking the unsubscribe link at the bottom of the email.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
