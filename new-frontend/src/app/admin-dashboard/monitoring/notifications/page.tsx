import dynamic from 'next/dynamic';

const NotificationsPage = dynamic(() => import('@/app/admin/monitoring/notifications/page'), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading notifications...</div>,
});

export default NotificationsPage;
