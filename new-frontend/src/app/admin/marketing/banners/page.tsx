'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Play, Pause, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface HomepageBanner {
  id: number;
  shop_id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  button_text: string;
  button_link: string;
  start_date: string;
  end_date: string;
  priority: number;
  status: string;
  created_at: string;
  updated_at: string;
  stats?: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

export default function BannerManagementPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [banners, setBanners] = useState<HomepageBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!user?.is_admin) {
      router.push('/admin');
      return;
    }

    fetchBanners();
  }, [user, router]);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const fetchBanners = async () => {
    try {
      const res = await api.get('/admin/advertising/banners');
      setBanners(res.data);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      toast({
        title: 'Error',
        description: 'Failed to load banners',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (bannerId: number) => {
    try {
      await api.post(`/admin/advertising/banners/${bannerId}/publish`);
      toast({
        title: 'Success',
        description: 'Banner published',
        variant: 'default',
      });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to publish banner',
        variant: 'destructive',
      });
    }
  };

  const handlePause = async (bannerId: number) => {
    try {
      await api.post(`/admin/advertising/banners/${bannerId}/pause`);
      toast({
        title: 'Success',
        description: 'Banner paused',
        variant: 'default',
      });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to pause banner',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (bannerId: number) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      await api.delete(`/admin/advertising/banners/${bannerId}`);
      toast({
        title: 'Success',
        description: 'Banner deleted',
        variant: 'default',
      });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to delete banner',
        variant: 'destructive',
      });
    }
  };

  const activeBanners = banners.filter(b => b.status === 'active');
  const currentBanner = activeBanners[currentSlide];

  if (!user?.is_admin) return null;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-8">
      {/* Hero Carousel Section */}
      {activeBanners.length > 0 && (
        <div className="relative w-full h-96 md:h-[500px] bg-gray-900 overflow-hidden rounded-xl">
          {/* Carousel Image */}
          <img
            src={currentBanner?.image_url}
            alt={currentBanner?.title}
            className="w-full h-full object-cover transition-opacity duration-500"
          />

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Content Overlay */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 text-white">
            {currentBanner && (
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                  {currentBanner.title}
                </h2>
                {currentBanner.subtitle && (
                  <p className="text-lg md:text-xl text-gray-100">
                    {currentBanner.subtitle}
                  </p>
                )}
                <div>
                  <Button
                    onClick={() => window.open(currentBanner.button_link, '_blank')}
                    className="bg-white text-gray-900 hover:bg-gray-100 font-semibold px-8"
                    size="lg"
                  >
                    {currentBanner.button_text}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {activeBanners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % activeBanners.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-colors z-10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Dot Indicators */}
          {activeBanners.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentSlide
                      ? 'bg-white w-8'
                      : 'bg-white/50 w-2 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Homepage Banners</h1>
            <p className="text-gray-600 mt-1">Manage rotating premium homepage advertising placements</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Banner
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="container mx-auto px-4 max-w-7xl">
          <Card className="p-6 border-blue-200 bg-blue-50">
            <CreateBannerForm
              onSuccess={() => {
                setShowCreateForm(false);
                fetchBanners();
              }}
            />
          </Card>
        </div>
      )}

      {/* Stats Overview */}
      {banners.length > 0 && (
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Banners"
              value={banners.length}
              subtext={`${activeBanners.length} active`}
            />
            <StatCard
              label="Total Impressions"
              value={banners.reduce((sum, b) => sum + (b.stats?.impressions || 0), 0).toLocaleString()}
            />
            <StatCard
              label="Total Clicks"
              value={banners.reduce((sum, b) => sum + (b.stats?.clicks || 0), 0).toLocaleString()}
            />
            <StatCard
              label="Avg CTR"
              value={`${(
                banners.reduce((sum, b) => sum + (b.stats?.ctr || 0), 0) / (banners.length || 1)
              ).toFixed(2)}%`}
            />
          </div>
        </div>
      )}

      {/* Banners Management */}
      <div className="container mx-auto px-4 max-w-7xl">
        {banners.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 mb-4">No banners yet</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              variant="outline"
            >
              Create the first banner
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mt-8">All Banners</h2>
            <div className="grid gap-4">
              {banners.map(banner => (
                <Card key={banner.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="grid md:grid-cols-4 gap-6">
                    {/* Thumbnail */}
                    <div className="md:col-span-1">
                      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <img
                          src={banner.image_url}
                          alt={banner.title}
                          className="w-full h-full object-cover"
                        />
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                          banner.status === 'active'
                            ? 'bg-green-500 text-white'
                            : banner.status === 'scheduled'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {banner.status.charAt(0).toUpperCase() + banner.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="md:col-span-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                        )}
                        <p className="text-sm text-blue-600 font-medium mt-2">{banner.button_text}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 py-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500">Starts</p>
                          <p className="font-semibold text-sm">{new Date(banner.start_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ends</p>
                          <p className="font-semibold text-sm">{new Date(banner.end_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Priority</p>
                          <p className="font-semibold text-sm">{banner.priority}/100</p>
                        </div>
                        {banner.stats && (
                          <div>
                            <p className="text-xs text-gray-500">CTR</p>
                            <p className="font-semibold text-sm">{banner.stats.ctr.toFixed(2)}%</p>
                          </div>
                        )}
                      </div>

                      {/* Analytics Cards */}
                      {banner.stats && (
                        <div className="grid grid-cols-3 gap-3 mt-4 bg-gray-50 p-3 rounded-lg">
                          <div className="text-center">
                            <p className="text-xs text-gray-600">Impressions</p>
                            <p className="font-bold text-gray-900">{banner.stats.impressions.toLocaleString()}</p>
                          </div>
                          <div className="text-center border-l border-r border-gray-200">
                            <p className="text-xs text-gray-600">Clicks</p>
                            <p className="font-bold text-gray-900">{banner.stats.clicks.toLocaleString()}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-gray-600">CTR</p>
                            <p className="font-bold text-gray-900">{banner.stats.ctr.toFixed(2)}%</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap mt-4">
                        {banner.status === 'draft' && (
                          <Button
                            onClick={() => handlePublish(banner.id)}
                            size="sm"
                            className="gap-2 bg-green-600 hover:bg-green-700"
                          >
                            <Play className="w-4 h-4" />
                            Publish
                          </Button>
                        )}
                        {banner.status === 'active' && (
                          <Button
                            onClick={() => handlePause(banner.id)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Pause className="w-4 h-4" />
                            Pause
                          </Button>
                        )}
                        <Button
                          onClick={() => router.push(`/admin/marketing/banners/${banner.id}`)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(banner.id)}
                          variant="ghost"
                          size="sm"
                          className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subtext }: { label: string; value: string | number; subtext?: string }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </Card>
  );
}

function CreateBannerForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shop_id: '',
    title: '',
    subtitle: '',
    image_url: '',
    mobile_image_url: '',
    button_text: 'Shop Now',
    button_link: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: '50',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/admin/advertising/banners', {
        ...formData,
        shop_id: parseInt(formData.shop_id),
        priority: parseInt(formData.priority),
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
      });

      toast({
        title: 'Success',
        description: 'Banner created successfully',
        variant: 'default',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create banner',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Create New Banner</h3>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">Shop ID</label>
        <input
          type="number"
          required
          value={formData.shop_id}
          onChange={(e) => setFormData({ ...formData, shop_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Title *</label>
          <input
            type="text"
            required
            placeholder="e.g., Summer Sale Promotion"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Subtitle</label>
          <input
            type="text"
            placeholder="e.g., Up to 50% off selected items"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Desktop Image URL *</label>
          <input
            type="url"
            required
            placeholder="https://example.com/banner.jpg"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Mobile Image URL</label>
          <input
            type="url"
            placeholder="https://example.com/banner-mobile.jpg"
            value={formData.mobile_image_url}
            onChange={(e) => setFormData({ ...formData, mobile_image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Button Text</label>
          <input
            type="text"
            value={formData.button_text}
            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Button Link *</label>
          <input
            type="url"
            required
            placeholder="https://suqafuran.com/shop/..."
            value={formData.button_link}
            onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Start Date *</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">End Date *</label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Priority (1-100)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Creating...' : 'Create Banner'}
        </Button>
      </div>
    </form>
  );
}
