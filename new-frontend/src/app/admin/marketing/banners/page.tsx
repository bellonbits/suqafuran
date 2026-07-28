'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuth';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Play, Pause, Eye } from 'lucide-react';

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

  useEffect(() => {
    if (!user?.is_admin) {
      router.push('/admin');
      return;
    }

    fetchBanners();
  }, [user, router]);

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

  if (!user?.is_admin) return null;
  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
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

      {/* Create Form (can be a modal or inline) */}
      {showCreateForm && (
        <Card className="p-6 mb-8 border-blue-200 bg-blue-50">
          <CreateBannerForm
            onSuccess={() => {
              setShowCreateForm(false);
              fetchBanners();
            }}
          />
        </Card>
      )}

      {/* Banner List */}
      <div className="grid gap-6">
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
          banners.map(banner => (
            <Card key={banner.id} className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                {/* Banner Preview */}
                <div className="md:col-span-1">
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-full h-32 object-cover rounded-lg border border-gray-200"
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">Desktop</p>
                </div>

                {/* Banner Details */}
                <div className="md:col-span-2">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="text-sm text-gray-600 mt-1">{banner.subtitle}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      banner.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : banner.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {banner.status.charAt(0).toUpperCase() + banner.status.slice(1)}
                    </span>
                  </div>

                  {/* Dates and Priority */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Start Date</p>
                      <p className="font-semibold text-gray-900">{new Date(banner.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">End Date</p>
                      <p className="font-semibold text-gray-900">{new Date(banner.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Priority</p>
                      <p className="font-semibold text-gray-900">{banner.priority}/100</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Button</p>
                      <p className="font-semibold text-gray-900">{banner.button_text}</p>
                    </div>
                  </div>

                  {/* Analytics */}
                  {banner.stats && (
                    <div className="grid grid-cols-3 gap-4 mb-4 bg-gray-50 p-3 rounded-lg text-sm">
                      <div>
                        <p className="text-gray-600">Impressions</p>
                        <p className="font-semibold text-gray-900">{banner.stats.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Clicks</p>
                        <p className="font-semibold text-gray-900">{banner.stats.clicks.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">CTR</p>
                        <p className="font-semibold text-gray-900">{banner.stats.ctr.toFixed(2)}%</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {banner.status === 'draft' && (
                      <Button
                        onClick={() => handlePublish(banner.id)}
                        size="sm"
                        className="gap-2"
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 ml-auto"
                      onClick={() => window.open(banner.button_link, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                      Preview Link
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
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
          <label className="block text-sm font-medium text-gray-900 mb-1">Title</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Subtitle</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Desktop Image URL</label>
          <input
            type="url"
            required
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Mobile Image URL</label>
          <input
            type="url"
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
          <label className="block text-sm font-medium text-gray-900 mb-1">Button Link</label>
          <input
            type="url"
            required
            value={formData.button_link}
            onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
          <input
            type="date"
            required
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
          <input
            type="date"
            required
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
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

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Creating...' : 'Create Banner'}
        </Button>
      </div>
    </form>
  );
}
