import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../services/deliveryService';
import { Package, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const DeliveryPage: React.FC = () => {
    const { t } = useTranslation();
    const { data: deliveries, isLoading } = useQuery({
        queryKey: ['my-deliveries'],
        queryFn: deliveryService.getMyDeliveries
    });



    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('delivery.title', 'Suqafuran Delivery')}</h1>
                    <p className="text-gray-500 mt-1">{t('delivery.subtitle', 'Track your orders and shipping status in real-time.')}</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <h3 className="font-bold text-gray-900">{t('delivery.activeShipments', 'Active Shipments')}</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('delivery.trackingId', 'Tracking ID...')}
                            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {isLoading ? (
                        <div className="p-20 text-center text-gray-400">{t('delivery.loading', 'Loading delivery data...')}</div>
                    ) : !deliveries || deliveries.length === 0 ? (
                        <div className="p-20 text-center">
                            <Package className="h-16 w-16 text-gray-100 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">{t('delivery.noDeliveries', 'No active deliveries')}</h3>
                            <p className="text-gray-500 mt-2 max-w-xs mx-auto">{t('delivery.noDeliveriesDesc', 'Items you buy or sell with Suqafuran Delivery will appear here.')}</p>
                        </div>
                    ) : (
                        deliveries.map((delivery) => (
                            <div key={delivery.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                {/* Sample delivery card content */}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
