import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustService, MeetingResponse, DealOutcome } from '../services/trustService';
import { Button } from './Button';
import { X, Check, HelpCircle } from 'lucide-react';

const TrustPrompts: React.FC = () => {
    const queryClient = useQueryClient();
    const { data: actions, isLoading } = useQuery({
        queryKey: ['pending-trust-actions'],
        queryFn: trustService.getPendingActions,
        refetchInterval: 30000, // Poll every 30s
    });

    const meetingMutation = useMutation({
        mutationFn: ({ id, response }: { id: number, response: MeetingResponse }) =>
            trustService.respondToMeeting(id, response),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-trust-actions'] }),
    });

    const dealMutation = useMutation({
        mutationFn: ({ id, outcome }: { id: number, outcome: DealOutcome }) =>
            trustService.respondToDeal(id, outcome),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-trust-actions'] }),
    });

    if (isLoading || !actions || (actions.meetings.length === 0 && actions.deals.length === 0)) {
        return null;
    }

    return (
        <div className="space-y-4 mb-8">
            {actions.meetings.map((m: any) => (
                <div key={`m-${m.id}`} className="bg-primary-50 border border-primary-100 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary-600 shadow-sm">
                            <HelpCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Did you meet the seller for "{m.listing_title}"?</h4>
                            <p className="text-sm text-gray-500">Your feedback helps us keep the community safe.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none h-11 px-6 rounded-xl bg-white"
                            onClick={() => meetingMutation.mutate({ id: m.id, response: MeetingResponse.YES })}
                        >
                            <Check className="w-4 h-4 mr-2 text-green-500" />
                            Yes, we met
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none h-11 px-6 rounded-xl bg-white"
                            onClick={() => meetingMutation.mutate({ id: m.id, response: MeetingResponse.NO })}
                        >
                            <X className="w-4 h-4 mr-2 text-red-500" />
                            No
                        </Button>
                    </div>
                </div>
            ))}

            {actions.deals.map((d: any) => (
                <div key={`d-${d.id}`} className="bg-secondary-50 border border-secondary-100 rounded-2xl p-4 md:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-secondary-600 shadow-sm">
                            <Check className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Was the item "{d.listing_title}" bought?</h4>
                            <p className="text-sm text-gray-500">Confirming successful deals builds your trust score.</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button
                            variant="secondary"
                            className="flex-1 md:flex-none h-11 px-6 rounded-xl"
                            onClick={() => dealMutation.mutate({ id: d.id, outcome: DealOutcome.BOUGHT })}
                        >
                            Item Bought
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 md:flex-none h-11 px-6 rounded-xl bg-white"
                            onClick={() => dealMutation.mutate({ id: d.id, outcome: DealOutcome.NOT_BOUGHT })}
                        >
                            Not Bought
                        </Button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export { TrustPrompts };
