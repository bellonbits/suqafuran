'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Zap, AlertCircle, CheckCircle } from 'lucide-react';

interface FeaturedPlacement {
  id: number;
  placement_type: string;
  is_active: boolean;
  is_paid: boolean;
  starts_at: string;
  ends_at: string;
  price_kes: number;
  days_remaining: number;
}

interface Pricing {
  featured_product: { price: number; unit: string; description: string };
  featured_shop: { price: number; unit: string; description: string };
  homepage_banner: { price: number; unit: string; description: string };
  category_featured: { price: number; unit: string; description: string };
}

export default function FeaturedAdsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [placements, setPlacements] = useState<FeaturedPlacement[]>([]);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [selectedPlacement, setSelectedPlacement] = useState<string | null>(null);
  const [duration, setDuration] = useState(7);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [placementsRes, pricingRes] = await Promise.all([
          api.get(`/featured/sellers/${user.id}/placements`),
          api.get('/featured/pricing'),
        ]);
        setPlacements(placementsRes.data.placements);
        setPricing(pricingRes.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load featured advertising data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router, toast]);

  const handlePurchase = async () => {
    if (!selectedPlacement) return;

    setPurchasing(true);
    try {
      const response = await api.post(`/featured/sellers/${user?.id}/purchase`, {
        placement_type: selectedPlacement,
        duration_days: duration,
      });

      toast({
        title: 'Success',
        description: `Featured ${selectedPlacement} created. Total: KSh ${response.data.price_kes}`,
        variant: 'default',
      });

      // Refresh placements
      const res = await api.get(`/featured/sellers/${user?.id}/placements`);
      setPlacements(res.data.placements);
      setSelectedPlacement(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to purchase placement',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
    }
  };

  if (!user) return null;
  if (loading) return <div className="p-6">Loading...</div>;

  const activePlacements = placements.filter(p => p.is_active);
  const selectedPrice = selectedPlacement && pricing ? (pricing as any)[selectedPlacement]?.price : 0;
  const totalCost = selectedPrice * (duration / (selectedPlacement?.includes('product') ? 1 : 7));

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Featured Advertising</h1>
        <p className="text-gray-600 mt-2">
          Boost your shop visibility with premium placements
        </p>
      </div>

      {/* Active Placements */}
      {activePlacements.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Active Placements</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {activePlacements.map(placement => (
              <Card key={placement.id} className="p-4 border-green-200 bg-green-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {placement.placement_type.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {placement.days_remaining} days remaining
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      KSh {placement.price_kes.toLocaleString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Renew
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Section */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Placement Options */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Placements</h2>
          <div className="space-y-3">
            {pricing && (
              <>
                <PlacementOption
                  name="Featured Product"
                  price={pricing.featured_product.price}
                  unit={pricing.featured_product.unit}
                  description={pricing.featured_product.description}
                  selected={selectedPlacement === 'featured_product'}
                  onClick={() => setSelectedPlacement('featured_product')}
                  icon={<Zap className="w-5 h-5" />}
                />
                <PlacementOption
                  name="Featured Shop"
                  price={pricing.featured_shop.price}
                  unit={pricing.featured_shop.unit}
                  description={pricing.featured_shop.description}
                  selected={selectedPlacement === 'featured_shop'}
                  onClick={() => setSelectedPlacement('featured_shop')}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <PlacementOption
                  name="Homepage Banner"
                  price={pricing.homepage_banner.price}
                  unit={pricing.homepage_banner.unit}
                  description={pricing.homepage_banner.description}
                  selected={selectedPlacement === 'homepage_banner'}
                  onClick={() => setSelectedPlacement('homepage_banner')}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <PlacementOption
                  name="Category Featured"
                  price={pricing.category_featured.price}
                  unit={pricing.category_featured.unit}
                  description={pricing.category_featured.description}
                  selected={selectedPlacement === 'category_featured'}
                  onClick={() => setSelectedPlacement('category_featured')}
                  icon={<Zap className="w-5 h-5" />}
                />
              </>
            )}
          </div>
        </div>

        {/* Purchase Form */}
        {selectedPlacement && (
          <Card className="p-6 h-fit border-blue-200 bg-blue-50">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900">Purchase Details</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {(pricing as any)[selectedPlacement]?.description}
                </p>
              </div>

              {/* Duration Input */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Duration
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value)))}
                    min="1"
                    max="365"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600">
                    {selectedPlacement.includes('product') ? 'days' : 'weeks'}
                  </span>
                </div>
              </div>

              {/* Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">
                    KSh {selectedPrice.toLocaleString()}/{selectedPlacement.includes('product') ? 'day' : 'week'}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>KSh {Math.round(totalCost).toLocaleString()}</span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-white border border-blue-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  You'll pay via M-Pesa. Your placement goes live immediately after payment confirmation.
                </p>
              </div>

              {/* CTA */}
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handlePurchase}
                disabled={purchasing}
              >
                {purchasing ? 'Processing...' : `Purchase for KSh ${Math.round(totalCost).toLocaleString()}`}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Benefits */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Why Featured Ads?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Increase Visibility</h3>
            <p className="text-sm text-gray-600">
              Get featured placement in search results, homepage, and category pages
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Instant Results</h3>
            <p className="text-sm text-gray-600">
              Your placement goes live immediately after payment confirmation
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Flexible Duration</h3>
            <p className="text-sm text-gray-600">
              Choose your placement duration from 1 day to 1 year
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function PlacementOption({
  name,
  price,
  unit,
  description,
  selected,
  onClick,
  icon,
}: {
  name: string;
  price: number;
  unit: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={selected ? 'text-blue-600' : 'text-gray-400'}>{icon}</div>
          <div>
            <h3 className="font-semibold text-gray-900">{name}</h3>
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-lg font-bold text-gray-900">KSh {price.toLocaleString()}</p>
          <p className="text-xs text-gray-600">/{unit}</p>
        </div>
      </div>
    </button>
  );
}
