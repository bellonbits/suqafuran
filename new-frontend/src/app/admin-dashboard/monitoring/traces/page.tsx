import dynamic from 'next/dynamic';

const TracesPage = dynamic(() => import('@/app/admin/monitoring/traces/page'), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading traces...</div>,
});

export default TracesPage;
