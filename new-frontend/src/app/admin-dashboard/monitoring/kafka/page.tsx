import dynamic from 'next/dynamic';

const KafkaPage = dynamic(() => import('@/app/admin/monitoring/kafka/page'), {
  loading: () => <div className="p-8 text-center text-gray-500">Loading Kafka metrics...</div>,
});

export default KafkaPage;
