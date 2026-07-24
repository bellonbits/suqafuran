'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SavedSearch {
  id: number;
  user_id: number;
  name: string;
  query: string;
  category_id?: number;
  min_price?: number;
  max_price?: number;
  location?: string;
  is_active: boolean;
  created_at: string;
  last_matched_at?: string;
  match_count: number;
}

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    query: '',
    category_id: '',
    min_price: '',
    max_price: '',
    location: '',
  });

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      const res = await fetch('/api/v1/saved-searches');
      if (!res.ok) throw new Error('Failed to fetch saved searches');
      const data = await res.json();
      setSearches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/v1/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          query: formData.query,
          category_id: formData.category_id ? parseInt(formData.category_id) : null,
          min_price: formData.min_price ? parseFloat(formData.min_price) : null,
          max_price: formData.max_price ? parseFloat(formData.max_price) : null,
          location: formData.location || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create search');
      setFormData({ name: '', query: '', category_id: '', min_price: '', max_price: '', location: '' });
      setShowForm(false);
      fetchSearches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDelete = async (searchId: number) => {
    try {
      const res = await fetch(`/api/v1/saved-searches/${searchId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete search');
      fetchSearches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Saved Searches</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : 'New Search'}
          </button>
        </div>

        {error && <div className="text-red-600 mb-4">Error: {error}</div>}

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Search name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
              <input
                type="text"
                placeholder="Search query"
                value={formData.query}
                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Min price"
                  value={formData.min_price}
                  onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={formData.max_price}
                  onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Save Search
              </button>
            </form>
          </div>
        )}

        {searches.length === 0 ? (
          <div className="text-center text-gray-600 dark:text-gray-400">
            No saved searches yet
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <div
                key={search.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {search.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Query: {search.query}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      search.is_active
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {search.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {search.min_price && <p>Min: {search.min_price.toLocaleString()}</p>}
                  {search.max_price && <p>Max: {search.max_price.toLocaleString()}</p>}
                  {search.location && <p>Location: {search.location}</p>}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {search.match_count} matches • Created {new Date(search.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => router.push(`/search?q=${search.query}`)}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
