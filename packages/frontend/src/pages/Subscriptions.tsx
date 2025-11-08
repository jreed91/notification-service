import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionApi } from '../api/subscriptions';
import { templateApi } from '../api/templates';
import { DeliveryChannel } from '@notification-service/shared';
import { useState } from 'react';

export function Subscriptions() {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions', userId],
    queryFn: () => subscriptionApi.list(userId!),
    enabled: !!userId,
  });

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ templateKey, channels }: { templateKey: string; channels: any }) =>
      subscriptionApi.update(userId!, { templateKey, channels }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', userId] });
    },
  });

  const handleToggleChannel = (templateKey: string, channel: DeliveryChannel, enabled: boolean) => {
    const subscription = subscriptionsData?.subscriptions.find((s) => s.templateKey === templateKey);
    const channels = subscription?.channels || {};

    updateMutation.mutate({
      templateKey,
      channels: {
        ...channels,
        [channel]: enabled,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="mt-2 text-gray-600">
          Manage subscription preferences for user {userId?.slice(0, 8)}...
        </p>
      </div>

      <div className="space-y-4">
        {templatesData?.templates.map((template) => {
          const subscription = subscriptionsData?.subscriptions.find(
            (s) => s.templateKey === template.key
          );

          return (
            <div key={template.id} className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(template.channels as DeliveryChannel[]).map((channel) => {
                  const isEnabled = subscription?.channels?.[channel] ?? true;

                  return (
                    <label key={channel} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) => handleToggleChannel(template.key, channel, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{channel}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
