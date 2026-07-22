import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '@/services/api';

interface Listing {
  id: number;
  title_en: string;
  description_en: string;
  price: number;
  location: string;
  condition: string;
  images: string[];
  category_id: number;
  subcategory_id?: number;
  is_negotiable: boolean;
  created_at: string;
  owner?: {
    id: number;
    username: string;
    is_verified: boolean;
  };
}

interface Attribute {
  attribute_name: string;
  attribute_slug: string;
  value: string;
}

const ListingDetailPage: React.FC = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      try {
        setLoading(true);
        const listingRes = await api.get(`/listings/${listingId}`);
        setListing(listingRes.data);

        const attrsRes = await api.get(
          `/listings/${listingId}/attributes`
        );
        setAttributes(attrsRes.data);
      } catch (err) {
        setError('Failed to load listing');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadListing();
  }, [listingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading listing...</p>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Listing not found'}</p>
          <button
            onClick={() => navigate('/browse')}
            className="text-blue-600 hover:underline"
          >
            Back to listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <div className="flex gap-3">
            <button
              onClick={() =>
                navigate(`/listings/${listingId}/edit`, { state: { listing } })
              }
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50"
            >
              Edit
            </button>
            <button
              onClick={() => navigate(`/listings/${listingId}/contact`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Contact Seller
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Images Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Main Image */}
              <div className="aspect-square bg-gray-200 relative">
                {listing.images.length > 0 ? (
                  <>
                    <img
                      src={listing.images[selectedImage]}
                      alt={listing.title_en}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-full text-sm">
                      {selectedImage + 1} / {listing.images.length}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No images
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {listing.images.length > 1 && (
                <div className="bg-gray-100 p-4 grid grid-cols-6 gap-2">
                  {listing.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition ${
                        selectedImage === idx
                          ? 'border-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details Section */}
          <div>
            <div className="bg-white rounded-lg shadow-lg p-8 space-y-6 sticky top-6">
              {/* Price */}
              <div>
                <p className="text-gray-600 text-sm mb-1">Price</p>
                <h1 className="text-4xl font-bold text-gray-900">
                  ${listing.price.toLocaleString()}
                </h1>
                {listing.is_negotiable && (
                  <p className="text-blue-600 text-sm mt-1">Negotiable</p>
                )}
              </div>

              <hr />

              {/* Title & Location */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {listing.title_en}
                </h2>
                <p className="text-gray-600 flex items-center gap-2">
                  <MapPin size={18} />
                  {listing.location}
                </p>
              </div>

              {/* Condition */}
              <div>
                <p className="text-gray-600 text-sm mb-2">Condition</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                  {listing.condition}
                </span>
              </div>

              {/* Seller Info */}
              {listing.owner && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm mb-3">Seller</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {listing.owner.username}
                      </p>
                      {listing.owner.is_verified && (
                        <p className="text-green-600 text-xs flex items-center gap-1">
                          <CheckCircle size={14} />
                          Verified
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Posted Date */}
              <div className="text-xs text-gray-500">
                Posted {new Date(listing.created_at).toLocaleDateString()}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate(`/listings/${listingId}/contact`)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Contact Seller
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {listing.description_en}
          </p>
        </div>

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {attributes.map((attr, idx) => (
                <div key={idx} className="border-l-4 border-blue-600 pl-4">
                  <p className="text-gray-600 text-sm uppercase tracking-wide mb-1">
                    {attr.attribute_name}
                  </p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {attr.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={20} />
            Safety Tips
          </p>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Meet in public places</li>
            <li>• Inspect the item before making payment</li>
            <li>• Use secure payment methods</li>
            <li>• Report suspicious listings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
