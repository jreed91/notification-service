import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { templateApi } from '../api/templates';
import { userApi } from '../api/users';
import { notificationApi } from '../api/notifications';
import { DeliveryChannel } from '@notification-service/shared';

export function SendNotification() {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [variables, setVariables] = useState('{}');
  const [selectedChannels, setSelectedChannels] = useState<DeliveryChannel[]>([]);

  const { data: templatesData } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templateApi.list(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.list(),
  });

  const sendMutation = useMutation({
    mutationFn: notificationApi.send,
    onSuccess: () => {
      alert('Notification sent successfully!');
      setSelectedTemplate('');
      setSelectedUser('');
      setVariables('{}');
      setSelectedChannels([]);
    },
    onError: (error: any) => {
      alert(`Failed to send notification: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const parsedVariables = JSON.parse(variables);

      sendMutation.mutate({
        userId: selectedUser,
        templateKey: selectedTemplate,
        variables: parsedVariables,
        channels: selectedChannels.length > 0 ? selectedChannels : undefined,
      });
    } catch (error) {
      alert('Invalid JSON in variables field');
    }
  };

  const template = templatesData?.templates.find((t) => t.key === selectedTemplate);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Send Notification</h1>
        <p className="mt-2 text-gray-600">Send a notification to a user</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Template</label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a template</option>
            {templatesData?.templates.map((template) => (
              <option key={template.id} value={template.key}>
                {template.name} ({template.key})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a user</option>
            {usersData?.users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.email || user.phoneNumber || user.id}
              </option>
            ))}
          </select>
        </div>

        {template && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channels</label>
            <div className="space-y-2">
              {(template.channels as DeliveryChannel[]).map((channel) => (
                <label key={channel} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(channel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedChannels([...selectedChannels, channel]);
                      } else {
                        setSelectedChannels(selectedChannels.filter((c) => c !== channel));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{channel}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Leave unchecked to use user's subscribed channels
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Variables (JSON)
          </label>
          <textarea
            value={variables}
            onChange={(e) => setVariables(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder='{"name": "John", "amount": 100}'
          />
          <p className="mt-2 text-sm text-gray-500">
            Enter variables as JSON that will be substituted in the template
          </p>
        </div>

        <button
          type="submit"
          disabled={sendMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {sendMutation.isPending ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}
