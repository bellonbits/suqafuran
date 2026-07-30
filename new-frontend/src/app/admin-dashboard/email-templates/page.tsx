'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/DashboardLayout';
import { ADMIN_NAV_ITEMS } from '../navigation';
import { useAuthStore } from '@/store/useAuth';
import { Mail, Edit2, Trash2, Plus, Eye, Save, X, Copy } from 'lucide-react';

interface EmailTemplate {
  id: number;
  event_type: string;
  name: string;
  subject: string;
  html_content: string;
  text_content?: string;
  is_active: boolean;
  description?: string;
  variables?: string;
  created_at: string;
  updated_at: string;
}

export default function EmailTemplatesPage() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const navItems = ADMIN_NAV_ITEMS.map(item => ({
    ...item,
    icon: <item.icon className="w-5 h-5" />
  }));

  useEffect(() => {
    if (user?.is_admin) {
      fetchTemplates();
    }
  }, [user]);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/email-templates/');
      setTemplates(response.data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load email templates',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditing(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Delete this template? It will be deactivated.')) return;

    try {
      await api.delete(`/admin/email-templates/${templateId}`);
      toast({
        title: 'Success',
        description: 'Template deleted'
      });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      });
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/email-templates/${editing.id}`, formData);
        toast({
          title: 'Success',
          description: 'Template updated'
        });
      } else {
        await api.post('/admin/email-templates/', formData);
        toast({
          title: 'Success',
          description: 'Template created'
        });
      }
      setShowForm(false);
      setEditing(null);
      fetchTemplates();
    } catch (error: any) {
      console.error('Failed to save template:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save template',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Email Templates" navItems={navItems} userRole="admin">
        <div className="p-6">Loading templates...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Email Templates" navItems={navItems} userRole="admin">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Email Templates</h1>
            </div>
            <p className="text-gray-600">Manage and customize email templates</p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            New Template
          </button>
        </div>

        {/* Template List */}
        <div className="grid gap-4">
          {templates.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No templates found</p>
            </Card>
          ) : (
            templates.map(template => (
              <Card key={template.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        template.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Event:</strong> {template.event_type}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Subject:</strong> {template.subject}
                    </p>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                    )}
                    {template.variables && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Variables:</p>
                        <div className="flex flex-wrap gap-1">
                          {JSON.parse(template.variables).map((v: string) => (
                            <span key={v} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-mono">
                              {'{{'}{v}{'}'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditing(template);
                        setShowPreview(true);
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(template)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Edit/Create Form Modal */}
        {showForm && (
          <EmailTemplateForm
            template={editing}
            onSave={handleSave}
            onCancel={() => {
              setShowForm(false);
              setEditing(null);
            }}
            saving={saving}
          />
        )}

        {/* Preview Modal */}
        {showPreview && editing && (
          <TemplatePreviewModal
            template={editing}
            onClose={() => {
              setShowPreview(false);
              setEditing(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

function EmailTemplateForm({
  template,
  onSave,
  onCancel,
  saving
}: {
  template: EmailTemplate | null;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(template?.name || '');
  const [eventType, setEventType] = useState(template?.event_type || '');
  const [subject, setSubject] = useState(template?.subject || '');
  const [htmlContent, setHtmlContent] = useState(template?.html_content || '');
  const [textContent, setTextContent] = useState(template?.text_content || '');
  const [description, setDescription] = useState(template?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      event_type: eventType,
      subject,
      html_content: htmlContent,
      text_content: textContent || undefined,
      description: description || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {template ? 'Edit Template' : 'Create Template'}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                disabled={!!template}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select event type</option>
                <option value="signup">Signup</option>
                <option value="shop_created">Shop Created</option>
                <option value="listing_approved">Listing Approved</option>
                <option value="listing_rejected">Listing Rejected</option>
                <option value="price_dropped">Price Dropped</option>
                <option value="weekly_digest">Weekly Digest</option>
                <option value="saved_search_match">Saved Search Match</option>
                <option value="abandoned_listing">Abandoned Listing</option>
                <option value="inactive_seller">Inactive Seller</option>
                <option value="birthday">Birthday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Template description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">HTML Content</label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              placeholder="HTML email content..."
              rows={6}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">Use {{ variable_name }} for template variables</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">Text Content (Optional)</label>
            <textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Plain text fallback..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function TemplatePreviewModal({
  template,
  onClose
}: {
  template: EmailTemplate;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-96 overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Template Preview</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded border">
            <p className="text-sm text-gray-600 mb-2"><strong>Subject:</strong> {template.subject}</p>
            <div className="bg-white p-4 rounded border text-sm">
              <div dangerouslySetInnerHTML={{ __html: template.html_content }} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
