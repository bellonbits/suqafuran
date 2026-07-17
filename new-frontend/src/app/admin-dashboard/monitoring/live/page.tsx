import dynamic from 'next/dynamic';

const LivePage = dynamic(() => import('@/app/admin/monitoring/live/page'), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading live events...</div>,
});

export default LivePage;
