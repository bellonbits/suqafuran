import dynamic from 'next/dynamic';

const AlertsPage = dynamic(() => import('@/app/admin/monitoring/alerts/page'), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading alerts...</div>,
});

export default AlertsPage;
