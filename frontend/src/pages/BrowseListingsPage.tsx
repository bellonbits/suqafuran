import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/services/api';
import ListingSearch from '@/components/ListingSearch';

interface Category {
  id: number;
  name_en: string;
  slug: string;
}

const BrowseListingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined
  );
  const [loading, setLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await api.get('/listings/categories');
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">Browse Listings</h1>
          <p className="text-gray-600">Search and filter products from our marketplace</p>
        </div>
      </div>

      {/* Quick Category Links */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`p-3 rounded-lg text-center font-medium transition ${
                selectedCategory === undefined
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border'
              }`}
            >
              All Categories
            </button>
            {categories.slice(0, 5).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-3 rounded-lg text-center font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border'
                }`}
              >
                {cat.name_en}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Component */}
      {!loading && (
        <div className="py-8">
          <ListingSearch categoryId={selectedCategory} />
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading categories...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseListingsPage;
